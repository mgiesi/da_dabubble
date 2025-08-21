import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, User, authState } from '@angular/fire/auth';
import { distinctUntilChanged, firstValueFrom, map, Observable, shareReplay, take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
/**
 * Authentication service wrapping Firebase Auth for Angular.
 *
 * Exposes reactive authentication state via RxJS `Observable`s and provides
 * helper methods for common auth flows (email/password, Google sign-in, sign-out).
 *
 * ### Streams
 * - `user$`: Emits the current `User` (or `null`) whenever Firebase auth state changes.
 * - `isAuthenticated$`: Emits `true`/`false` whenever authentication status changes.
 * - `isAuthenticatedOnce$`: Resolves the authentication status **once** (useful for guards).
 *
 * All ongoing streams use `shareReplay(1)` so late subscribers receive the
 * latest value immediately, while `refCount: true` ensures the underlying
 * subscription is cleaned up when not used.
 */
export class AuthService {

  /** Observable of the current Firebase `User` or `null`. */
  readonly user$: Observable<User | null>;

  /** Observable of whether a user is currently authenticated. */
  readonly isAuthenticated$: Observable<boolean>;

  /** 
   * One-shot observable that emits the initial authentication status (`true`/`false`)
   * and then completes. Useful for route guards or startup checks.
   */
  readonly isAuthenticatedOnce$: Observable<boolean>;

  constructor(private auth: Auth) {
    this.user$ = authState(this.auth).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.isAuthenticated$ = this.user$.pipe(
      map((u) => !!u),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.isAuthenticatedOnce$ = this.user$.pipe(
      take(1),
      map((u) => !!u)
    );
  }

  /**
   * Returns a one-time snapshot of the current user.
   *
   * @returns Promise that resolves to the current `User` or `null`.
   */
  getCurrentUser(): Promise<User | null> {
    return firstValueFrom(this.user$.pipe(take(1)));
  }

  /**
   * Signs in using email and password.
   *
   * @param email User's email address.
   * @param password User's password.
   * @returns Promise that resolves with the authenticated `User`.
   * @throws Firebase auth errors (e.g., `auth/invalid-credential`).
   */
  async signIn(email: string, password: string): Promise<User> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  /**
   * Creates a new account using email and password and signs the user in.
   *
   * @param email New user's email address.
   * @param password New user's password.
   * @returns Promise that resolves with the newly created `User`.
   * @throws Firebase auth errors (e.g., `auth/email-already-in-use`).
   */
  async signUp(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    return result.user;
  }

  /**
   * Signs in with a Google popup flow.
   *
   * @returns Promise that resolves with the authenticated `User`.
   * @throws Firebase auth errors or popup blocker issues.
   */
  async signInWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  /**
   * Signs out the current user.
   *
   * @returns Promise that resolves when the user is signed out.
   */
  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}