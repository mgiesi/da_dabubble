import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileMenuComponent } from './features/profile/profile-menu/profile-menu.component';
import { AuthService } from './core/services/auth.service';
import { SharedFunctionsService } from '../../src/app/core/services/shared-functions.service';
import { LogoStateService } from './core/services/logo-state.service';
import { UsersService } from './core/repositories/users.service';
import { firstValueFrom, Observable, combineLatest } from 'rxjs';
import { UserPresenceService } from './core/services/user-presence.service';
import { OverlayLandscapeComponent } from './shared/overlay-landscape/overlay-landscape.component';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    ProfileMenuComponent,
    OverlayLandscapeComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private router = inject(Router);
  private auth = inject(AuthService);
  private sharedFunctions = inject(SharedFunctionsService);
  private logoState = inject(LogoStateService);

  private usersService: UsersService = inject(UsersService);
  private userPresenceService: UserPresenceService =
    inject(UserPresenceService);

  readonly logoSrc = this.logoState.logoSrc;
  readonly headerTitle = this.logoState.headerTitle;
  readonly showBackArrow = this.logoState.showBackArrow;

  title = 'DABubble';
  isAuthenticated$ = this.auth.isAuthenticated$;
  showAnimation$ = this.sharedFunctions.showAnimation$;
  logoLoaded = false;
  overlayTimerDone = false;
  showLogoBox = false;
  emailExists: boolean | null = null;
  emailCheckInProgress = false;
  googleLoginInProgress = false;
  inProgress = false;
  errMsg: string = '';
  email: string = '';
  pwd: string = '';

  showHeader$: Observable<boolean> = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => true),
    startWith(true)
  );

  showSearchLabel$: Observable<boolean> = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(
      () =>
        !window.location.pathname.includes('imprint') &&
        !window.location.pathname.includes('privacy-policy')
    ),
    startWith(
      !window.location.pathname.includes('imprint') &&
        !window.location.pathname.includes('privacy-policy')
    )
  );

  shouldShowAnimation$: Observable<boolean> = combineLatest([
    this.showAnimation$,
    this.router.events.pipe(
      startWith(null),
      map(() => !this.router.url.includes('reset-password'))
    ),
  ]).pipe(map(([show, notReset]) => show && notReset));

  get emailPattern(): string {
    return AuthService.EMAIL_PATTERN.source;
  }

  get emailPatternHtml(): string {
    return AuthService.getEmailPatternHtml();
  }

  // ngOnInit(): void {
  //   // setLogLevel('debug'); // am App-Start einmalig
  //   this.initRedirectAndAnimation();
  //   this.userPresenceService.init();
  // }

  private checkFirstVisitAndShowAnimation(): void {
    const hasVisited = sessionStorage.getItem('firstPageVisit');
    if (!hasVisited) {
      this.sharedFunctions.setShowAnimation(true);
      sessionStorage.setItem('firstPageVisit', 'true');
      setTimeout(() => {
        this.showLogoBox = true;
      }, 3800);
      setTimeout(() => {
        this.overlayTimerDone = true;
        this.tryHideOverlay();
      }, 4100);
    } else {
      this.showLogoBox = true;
    }
  }

  onLogoLoad() {
    this.logoLoaded = true;
    this.tryHideOverlay();
  }

  private tryHideOverlay() {
    if (this.overlayTimerDone && this.logoLoaded) {
      this.sharedFunctions.setShowAnimation(false);
    }
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

  private isEmailValid(email: string): boolean {
    return !!email && AuthService.EMAIL_PATTERN.test(email);
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
    await (
      await import('rxjs')
    ).firstValueFrom(
      this.auth.isAuthenticated$.pipe(
        (
          await import('rxjs')
        ).filter((authenticated: boolean) => authenticated === true)
      )
    );
    await this.router.navigate(['/chat']);
  }

  public mapAuthError(err: unknown): string {
    const fallback = 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.';
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as any).code;
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

  onBackClick() {
    const isMobile = window.innerWidth < 768; // prüfe < $main_layout_mobile
    this.logoState.setCurrentView('workspace');
    if (isMobile) this.router.navigate(['/m/workspace'], { replaceUrl: true });
  }
}
