import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';
import { firstValueFrom, filter } from 'rxjs';
import { LegalBtnsComponent } from '../auth-assets/legal-btns/legal-btns.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SharedFunctionsService } from '../../../core/services/shared-functions.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LegalBtnsComponent,
    MatProgressBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [fadeInOut],
})
export class LoginComponent implements OnInit {
  @Output() showAnimationBoolean = new EventEmitter<boolean>();

  auth = inject(AuthService);
  router = inject(Router);
  usersService = inject(UsersService);
  sharedFunctions = inject(SharedFunctionsService);
  showAnimation$ = this.sharedFunctions.showAnimation$;

  emailExists: boolean | null = null;
  emailCheckInProgress = false;
  googleLoginInProgress = false;
  inProgress = false;
  errMsg: string = '';
  email: string = '';
  pwd: string = '';

  get emailPattern(): string {
    return AuthService.EMAIL_PATTERN.source;
  }

  get emailPatternHtml(): string {
    return AuthService.getEmailPatternHtml();
  }

  async checkEmailExistsOnBlur() {
    this.resetEmailCheckState();
    if (!this.isEmailValid(this.email)) return;
    await this.performEmailCheck();
  }

  private resetEmailCheckState() {
    this.emailExists = null;
    this.errMsg = '';
  }

  private isEmailValid(email: string): boolean {
    return !!email && AuthService.EMAIL_PATTERN.test(email);
  }

  private async performEmailCheck() {
    this.emailCheckInProgress = true;
    this.emailExists = await this.auth.emailExists(this.email);
    this.emailCheckInProgress = false;
  }

  emitBoolean() {
    this.showAnimationBoolean.emit(false);
  }

  private checkFirstVisitAndShowAnimation(): void {
    const hasVisited = sessionStorage.getItem('firstPageVisit');

    if (!hasVisited) {
      this.sharedFunctions.setShowAnimation(true);
      sessionStorage.setItem('firstPageVisit', 'true');
      setTimeout(() => {
        this.sharedFunctions.setShowAnimation(false);
      }, 4100);
    }
  }

  async signInAsGuest() {
    this.prepareSignIn();
    try {
      await this.signIn('guest@guest.com', 'secretguest');
    } catch (e) {
      this.handleSignInError(e);
    } finally {
      this.finishSignIn();
    }
  }

  private prepareSignIn() {
    this.errMsg = '';
    this.inProgress = true;
  }

  private finishSignIn() {
    this.inProgress = false;
  }

  private handleSignInError(e: any) {
    this.errMsg = this.mapAuthError(e);
  }

  async ngOnInit(): Promise<void> {
    await this.initRedirectAndAnimation();
  }

  private async initRedirectAndAnimation() {
    await this.handleRedirectResult();
    this.checkFirstVisitAndShowAnimation();
  }

  private async handleRedirectResult(): Promise<void> {
    try {
      await this.tryHandleRedirect();
    } catch (error: any) {
      this.logRedirectError(error);
    }
  }

  private async tryHandleRedirect() {
    const { getRedirectResult } = await import('firebase/auth');
    const result = await getRedirectResult(this.auth.firebaseAuth);
    if (result && result.user) {
      await this.handleRedirectUser(result.user);
      await this.router.navigate(['/chat']);
    }
  }

  private async handleRedirectUser(user: any) {
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
  }

  private logRedirectError(error: any) {
    if (error.code && error.code !== 'auth/argument-error') {
      console.error('Redirect-Ergebnis Fehler:', error);
    }
  }

  async triggerGoogleSignIn() {
    if (this.googleLoginInProgress) return;
    this.prepareGoogleSignIn();
    try {
      await this.tryGooglePopup();
    } catch (error: any) {
      await this.handleGoogleSignInError(error);
    } finally {
      this.finishGoogleSignIn();
    }
  }

  private prepareGoogleSignIn() {
    this.errMsg = '';
    this.googleLoginInProgress = true;
  }

  private finishGoogleSignIn() {
    if (this.googleLoginInProgress) this.googleLoginInProgress = false;
  }

  private async tryGooglePopup() {
    const result = await this.auth.signInWithGoogleOAuth();
    if (result && result.user) {
      await this.handleGoogleUserAndNavigate(result.user);
    }
  }

  private async handleGoogleUserAndNavigate(user: any) {
    await this.handleGoogleUser(user);
    await this.router.navigate(['/chat']);
  }

  private async handleGoogleUser(user: any) {
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

  private async handleGoogleSignInError(error: any) {
    if (this.isGooglePopupClosed(error)) {
      this.handleGooglePopupClosed();
      return;
    }
    this.logGooglePopupError(error);
    if (this.isGooglePopupBlocked(error)) {
      await this.handleGooglePopupBlocked();
    } else if (this.isGooglePopupMultiRequest(error)) {
      this.errMsg = 'Bitte warte kurz, bevor du es erneut versuchst.';
    } else if (this.isGoogleNotSupported(error)) {
      this.errMsg = 'Google Sign-In wird in dieser Umgebung nicht unterstützt.';
    } else if (this.isGoogleArgumentError(error)) {
      this.errMsg =
        'Firebase Konfigurationsfehler. Bitte Administrator kontaktieren.';
    } else {
      this.errMsg = this.mapAuthError(error);
    }
  }

  private isGooglePopupClosed(error: any): boolean {
    return (
      error.code === 'auth/popup-closed-by-user' ||
      error.message?.includes('abgebrochen')
    );
  }

  private handleGooglePopupClosed() {
    this.googleLoginInProgress = false;
    this.errMsg = 'Google-Anmeldung wurde abgebrochen.';
    setTimeout(() => {
      this.errMsg = '';
    }, 3000);
  }

  private logGooglePopupError(error: any) {
    console.error('Google Popup Error:', error);
  }

  private isGooglePopupBlocked(error: any): boolean {
    return (
      error.message?.includes('Popup wurde blockiert') ||
      error.code === 'auth/popup-blocked'
    );
  }

  private isGooglePopupMultiRequest(error: any): boolean {
    return (
      error.message?.includes('Mehrere Popup-Anfragen') ||
      error.code === 'auth/cancelled-popup-request'
    );
  }

  private isGoogleNotSupported(error: any): boolean {
    return error.code === 'auth/operation-not-supported-in-this-environment';
  }

  private isGoogleArgumentError(error: any): boolean {
    return error.code === 'auth/argument-error';
  }

  private async handleGooglePopupBlocked() {
    try {
      console.log('Fallback zu Redirect-Methode...');
      await this.auth.signInWithGoogleRedirect();
    } catch (redirectError: any) {
      console.error('Google Redirect Error:', redirectError);
      this.errMsg =
        'Google Sign-In nicht verfügbar. Bitte Popup-Blocker deaktivieren.';
    }
  }

  async signIn(inputEmail: string = this.email, inputPwd: string = this.pwd) {
    this.prepareSignIn();
    try {
      if (!this.isSignInInputValid(inputEmail, inputPwd)) return;
      if (!this.isGuestLogin(inputEmail)) {
        if (!this.isEmailValid(inputEmail)) return;
        await this.checkEmailExistsOrReturn(inputEmail);
      }
      await this.doSignIn(inputEmail, inputPwd);
      await this.waitForAuthAndNavigate();
    } catch (e) {
      this.handleSignInError(e);
    } finally {
      this.finishSignIn();
    }
  }

  private isSignInInputValid(email: string, pwd: string): boolean {
    return !!email && !!pwd;
  }

  private isGuestLogin(email: string): boolean {
    return email === 'guest@guest.com';
  }

  private async checkEmailExistsOrReturn(email: string) {
    this.emailExists = await this.auth.emailExists(email);
    if (!this.emailExists) return;
  }

  private async doSignIn(email: string, pwd: string) {
    await this.auth.signIn(email, pwd);
  }

  private async waitForAuthAndNavigate() {
    await firstValueFrom(
      this.auth.isAuthenticated$.pipe(
        filter((authenticated) => authenticated === true)
      )
    );
    await this.router.navigate(['/chat']);
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
