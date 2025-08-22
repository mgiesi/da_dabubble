import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';
import { firstValueFrom, filter } from 'rxjs';
import { LegalBtnsComponent } from '../auth-assets/legal-btns/legal-btns.component';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LegalBtnsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  email: string = '';
  pwd: string = '';

  inProgress = false;
  errMsg: string = '';

  async signInAsGuest() {
    this.signIn('guest@guest.com', 'secretguest');
  }

  ngOnInit(): void {
    // Initialisiere die Google-Anmeldung
    // this.initializeGoogleLogin();
  }

  /**
   * Initialisiert und rendert den Google-Button.
   * Der gerenderte Button ist unsichtbar, damit wir ihn anklicken können.
   */
  initializeGoogleLogin() {
    setTimeout(() => {
      if (
        typeof google !== 'undefined' &&
        google.accounts &&
        google.accounts.id
      ) {
        google.accounts.id.initialize({
          client_id: 'DEINE_ECHTE_CLIENT_ID.apps.googleusercontent.com', // Hier muss deine echte ID stehen!
          callback: this.handleCredentialResponse.bind(this),
          ux_mode: 'popup',
        });

        google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
          }
        );
      } else {
        console.error(
          'Google Identity Service Skript nicht geladen oder verfügbar!'
        );
      }
    }, 0);
  }

  async signInWithGoogle() {
    const googleBtnContainer = document.getElementById('g_id_signin');
    if (googleBtnContainer && googleBtnContainer.firstChild) {
      (googleBtnContainer.firstChild as HTMLElement).click();
    } else {
      console.error(
        'Google-Button-Container oder dessen Inhalt nicht gefunden!'
      );
    }
  }

  // async signInWithGoogle() {
  //   const googleBtn = document.getElementById('g_id_signin');
  //   if (googleBtn) {
  //     (googleBtn.firstChild as HTMLElement)?.click();
  //   } else {
  //     console.error('Google-Button-Container nicht gefunden!');
  //   }
  // }

  /**
   * Verarbeitet die Google-Token-Antwort nach erfolgreicher Anmeldung.
   */
  async handleCredentialResponse(response: any) {
    console.log('Token: ' + response.credential);

    this.inProgress = true;

    try {
      await this.auth.signInWithGoogleToken(response.credential);
      this.router.navigate(['/chat']);
    } catch (e) {
      console.error('Google Sign-in failed', e);
      this.errMsg = this.mapAuthError(e);
    } finally {
      this.inProgress = false;
    }
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
