import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';
import { firstValueFrom, filter } from 'rxjs';
import { LegalBtnsComponent } from '../auth-assets/legal-btns/legal-btns.component';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, LegalBtnsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  email: string = '';
  pwd: string = '';

  inProgress = false;
  errMsg: string = '';

  async signInAsGuest() {
    this.signIn('guest@guest.com', 'secretguest');
  }

  async signIn(inputEmail: string = this.email, inputPwd: string = this.pwd) {
    this.errMsg = '';
    this.inProgress = true;

    try {
      if (!inputEmail || !inputPwd) {
        this.errMsg = 'Bitte E-Mail und Passwort eingeben.';
        return;
      }

      await this.auth.signIn(inputEmail, inputPwd);

      // ✅ Warte bis Auth-State wirklich updated ist bevor Navigation
      await firstValueFrom(
        this.auth.isAuthenticated$.pipe(
          filter((authenticated) => authenticated === true)
        )
      );

      await this.router.navigate(['/chat']);
    } catch (e) {
      console.error('Sign-in failed ', e);
      this.errMsg = this.mapAuthError(e);
    } finally {
      this.inProgress = false;
    }
  }

  private mapAuthError(err: unknown): string {
    const fallback = 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.';
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as FirebaseError).code;
      switch (code) {
        case 'auth/invalid-email':
          return 'Ungültige E-Mail-Adresse.';
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          return 'E-Mail und Passwort stimmen nicht überein.';
        case 'auth/user-disabled':
          return 'Dieses Konto wurde deaktiviert.';
        case 'auth/too-many-requests':
          return 'Zu viele Versuche. Bitte später erneut versuchen.';
        case 'auth/network-request-failed':
          return 'Netzwerkfehler. Bitte Verbindung prüfen.';
        default:
          return fallback;
      }
    }
    return fallback;
  }
}
