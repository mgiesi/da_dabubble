import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';
import { firstValueFrom, filter } from 'rxjs';
import { LegalBtnsComponent } from '../auth-assets/legal-btns/legal-btns.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LegalBtnsComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  usersService = inject(UsersService);

  email: string = '';
  pwd: string = '';

  inProgress = false;
  errMsg: string = '';

  async signInAsGuest() {
    this.signIn('guest@guest.com', 'secretguest');
  }

  async ngOnInit(): Promise<void> {
    // Redirect-Ergebnis verarbeiten (falls von Google zurückgekehrt)
    try {
      const { getRedirectResult } = await import('firebase/auth');
      const result = await getRedirectResult(this.auth.firebaseAuth);

      if (result && result.user) {
        // Prüfe, ob User-Dokument existiert, sonst anlegen
        const user = result.user;
        const userDoc = await firstValueFrom(this.usersService.currentUser$());
        if (!userDoc) {
          await this.usersService.createUser(
            user.uid,
            user.email ?? '',
            user.displayName ?? '',
            user.photoURL ?? ''
          );
        }
        console.log('Google Redirect erfolgreich:', user.email);
        await this.router.navigate(['/chat']);
      }
    } catch (error: any) {
      // Nur loggen, wenn es ein anderer Fehler als 'auth/argument-error' ist
      if (error.code && error.code !== 'auth/argument-error') {
        console.error('Redirect-Ergebnis Fehler:', error);
      }
      // Sonst ignoriere den Fehler still
    }
  }

  /**
   * Google Sign-In mit Fallback
   */
  async triggerGoogleSignIn() {
    if (this.inProgress) return; // Doppelklick-Schutz
    this.errMsg = '';
    this.inProgress = true;

    try {
      // Zuerst Popup versuchen
      const result = await this.auth.signInWithGoogleOAuth();
      if (result && result.user) {
        // Prüfe, ob User-Dokument existiert, sonst anlegen
        const user = result.user;
        const userDoc = await firstValueFrom(this.usersService.currentUser$());
        if (!userDoc) {
          await this.usersService.createUser(
            user.uid,
            user.email ?? '',
            user.displayName ?? '',
            user.photoURL ?? ''
          );
        }
      }
      await this.router.navigate(['/chat']);
    } catch (error: any) {
      console.error('Google Popup Error:', error);

      // Spezielle Behandlung für Popup-Probleme
      if (
        error.message?.includes('Popup wurde blockiert') ||
        error.code === 'auth/popup-blocked'
      ) {
        // Fallback zu Redirect
        try {
          console.log('Fallback zu Redirect-Methode...');
          await this.auth.signInWithGoogleRedirect();
          // Nach Redirect wird die App neu geladen, daher kein Navigation nötig
        } catch (redirectError: any) {
          console.error('Google Redirect Error:', redirectError);
          this.errMsg =
            'Google Sign-In nicht verfügbar. Bitte Popup-Blocker deaktivieren.';
        }
      } else if (
        error.message?.includes('abgebrochen') ||
        error.code === 'auth/popup-closed-by-user'
      ) {
        this.errMsg = 'Google-Anmeldung wurde abgebrochen.';
      } else if (
        error.message?.includes('Mehrere Popup-Anfragen') ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        this.errMsg = 'Bitte warte kurz, bevor du es erneut versuchst.';
      } else if (
        error.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        this.errMsg =
          'Google Sign-In wird in dieser Umgebung nicht unterstützt.';
      } else if (error.code === 'auth/argument-error') {
        this.errMsg =
          'Firebase Konfigurationsfehler. Bitte Administrator kontaktieren.';
      } else {
        this.errMsg = this.mapAuthError(error);
      }
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
        case 'auth/popup-closed-by-user':
          return 'Anmeldung wurde abgebrochen.';
        case 'auth/popup-blocked':
          return 'Popup wurde blockiert. Bitte Popup-Blocker deaktivieren.';
        case 'auth/cancelled-popup-request':
          return 'Mehrere Popup-Anfragen. Bitte warten Sie kurz.';
        case 'auth/argument-error':
          return 'Konfigurationsfehler. Bitte Administrator kontaktieren.';
        default:
          return fallback;
      }
    }
    return fallback;
  }
}
