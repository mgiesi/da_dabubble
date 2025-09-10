import { Component, inject, AfterViewInit } from '@angular/core';
import { AppComponent } from '../../../app.component';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { Router, RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SharedFunctionsService } from '../../../core/services/shared-functions.service';
import { AuthCardComponent } from '../auth-assets/authCard/auth-card.component';
import { RegisterDataService } from '../../../core/services/register-data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    AuthCardComponent,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [fadeInOut],
})
export class LoginComponent implements AfterViewInit {
  constructor(private appComponent: AppComponent) {}
  auth = inject(AuthService);
  router = inject(Router);
  usersService = inject(UsersService);
  showAnimation$ = inject(SharedFunctionsService).showAnimation$;
  registerData = inject(RegisterDataService);

  emailExists: boolean | null = null;
  emailCheckInProgress = false;
  googleLoginInProgress = false;
  inProgress = false;
  errMsg: string = '';
  email: string = '';
  pwd: string = '';

  ngAfterViewInit(): void {
    setTimeout(() => window.scrollTo(0, 0), 0.25);
  }

  get emailPattern(): string {
    return AuthService.EMAIL_PATTERN.source;
  }

  get emailPatternHtml(): string {
    return AuthService.getEmailPatternHtml();
  }

  private isEmailValid(email: string): boolean {
    return !!email && AuthService.EMAIL_PATTERN.test(email);
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
    this.errMsg = this.appComponent.mapAuthError(e);
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
    const userDoc = await (
      await import('rxjs')
    ).firstValueFrom(this.usersService.currentUser$());
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
      this.errMsg = this.appComponent.mapAuthError(error);
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
      }
      await this.doSignIn(inputEmail, inputPwd);
      await this.waitForAuthAndNavigate();
    } catch (e) {
      if (e && (e as any).code === 'auth/user-not-found') {
        this.errMsg = 'EMAIL_NOT_FOUND';
      } else if (e && (e as any).code === 'auth/wrong-password') {
        this.errMsg = 'WRONG_PASSWORD';
      } else {
        this.handleSignInError(e);
      }
    } finally {
      this.finishSignIn();
    }
  }

  private isGuestLogin(email: string): boolean {
    return email === 'guest@guest.com';
  }

  private isSignInInputValid(email: string, pwd: string): boolean {
    return !!email && !!pwd;
  }

  gotoRegisterUser() {
    this.registerData.displayName.set('');
    this.registerData.email.set('');
    this.registerData.pwd.set('');
    this.router.navigate(['/register']);
  }

  private async doSignIn(email: string, pwd: string) {
    await this.auth.signIn(email, pwd);
  }

  private async waitForAuthAndNavigate() {
    const { firstValueFrom, filter } = await import('rxjs');
    await firstValueFrom(
      this.auth.isAuthenticated$.pipe(
        filter((authenticated: boolean) => authenticated === true)
      )
    );
    await this.router.navigate(['/chat']);
  }
}
