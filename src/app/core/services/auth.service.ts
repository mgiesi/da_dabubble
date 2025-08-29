import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { Observable } from 'rxjs';
import { map, take, shareReplay } from 'rxjs/operators';
import {
  GoogleAuthProvider,
  signInWithPopup,
  browserPopupRedirectResolver,
} from 'firebase/auth';
import {
  Auth,
  UserCredential,
  signInWithCredential,
  authState,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  fetchSignInMethodsForEmail,
} from '@angular/fire/auth';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  static readonly EMAIL_PATTERN: RegExp =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  static getEmailPatternHtml(): string {
    return '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$';
  }
  get firebaseAuth() {
    return this.auth;
  }

  private auth = inject(Auth);
  private readonly injector = inject(EnvironmentInjector);
  
  user$: Observable<any> = authState(this.auth);
  isAuthenticated$: Observable<boolean> = this.user$.pipe(
    map((user) => !!user),
    shareReplay(1)
  );

  isAuthenticatedOnce$: Observable<boolean> = this.isAuthenticated$.pipe(
    take(1)
  );

  async emailExists(email: string): Promise<boolean> {
    try {
      const methods = await fetchSignInMethodsForEmail(this.auth, email);
      return methods && methods.length > 0;
    } catch (e) {
      return false;
    }
  }

  async signIn(email: string, password: string): Promise<UserCredential> {
    return runInInjectionContext(this.injector, () => signInWithEmailAndPassword(this.auth, email, password));
  }

  async signOut(): Promise<void> {
    return runInInjectionContext(this.injector, () => firebaseSignOut(this.auth));
  }

  async signInWithGoogleOAuth(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const result = await signInWithPopup(
        this.auth,
        provider,
        browserPopupRedirectResolver
      );

      console.log('Google Sign-in erfolgreich:', result.user.email);
      return result;
    } catch (error: any) {
      // Kein Logging für Popup geschlossen
      if (error.code === 'auth/popup-blocked') {
        throw new Error(
          'Popup wurde blockiert. Bitte Popup-Blocker deaktivieren.'
        );
      } else if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Anmeldung wurde abgebrochen.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Mehrere Popup-Anfragen. Bitte warten Sie kurz.');
      } else if (
        error.code === 'auth/operation-not-supported-in-this-environment'
      ) {
        throw new Error(
          'Google Sign-In wird in dieser Umgebung nicht unterstützt.'
        );
      } else if (error.code === 'auth/argument-error') {
        throw new Error(
          'Firebase Konfigurationsfehler. Bitte Administrator kontaktieren.'
        );
      }

      // Nur für andere Fehler loggen
      console.error('Google OAuth Sign-In Error:', error);
      throw error;
    }
  }

  async signInWithGoogleRedirect(): Promise<void> {
    try {
      const { signInWithRedirect } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      await signInWithRedirect(this.auth, provider);
    } catch (error) {
      console.error('Google Redirect Sign-In Error:', error);
      throw error;
    }
  }

  async signInWithGoogleToken(token: string): Promise<UserCredential> {
    try {
      const credential = GoogleAuthProvider.credential(token);
      return await signInWithCredential(this.auth, credential);
    } catch (error) {
      console.error('Firebase signInWithCredential error:', error);
      throw error;
    }
  }
}
