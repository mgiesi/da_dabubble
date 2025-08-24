import { computed, inject, Injectable, Signal } from '@angular/core';
import { UsersService } from '../repositories/users.service';
import { Auth } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, shareReplay } from 'rxjs';
import { User } from '../../shared/models/user';

@Injectable({
  providedIn: 'root'
})
/**
 * Facade over user-related data operations.
 */
export class UsersFacadeService {
  /** Repository that performs Firestore I/O for users. */
  private data = inject(UsersService);
  /** Firebase Auth instance used to determine the current user. */
  private auth = inject(Auth);

  constructor() { }

  /** A shared observable of all users from the Firestore. */
  private readonly users$ = this.data.users$().pipe(
    shareReplay({ bufferSize: 1, refCount: true})
  );
  /** Converts the shared users$ observable into an Angular Signal. */
  readonly users = toSignal<User[]>(this.users$, { initialValue: [] as any });
 
  private readonly currentUser$ = this.currentUser();
  readonly currentUserSig = toSignal<User | null>(this.currentUser$, { initialValue: null });
  
  /**
   * Returns the currently authenticated user as an observable of user.
   * This stream updates automatically when authentication state changes.
   */
  currentUser(): Observable<User | null> {
    return this.data.currentUser$();
  }

  /**
   * Creates a new user document via the repository.
   *
   * @param uid Firebase Auth UID.
   * @param email User's primary email address.
   * @param displayName Human-friendly display name.
   * @param imgUrl Absolute URL to the user's avatar image.
   * @returns Promise that resolves when the write completes.
   */
  async createUser(uid: string, email: string, displayName: string, imgUrl: string) {
    await this.data.createUser(uid, email, displayName, imgUrl);
  }

  /**
   * Updates the `displayName` for the specified user document.
   *
   * @param userId Firestore document ID (`users/{userId}`).
   * @param displayName New display name.
   * @returns Promise that resolves when the update completes.
   */
  async updateDisplayName(userId: string, displayName: string) {
    await this.data.updateDisplayName(userId, displayName);
  }

  /**
   * Updates the `imgUrl` (avatar) for the specified user document.
   *
   * @param userId Firestore document ID (`users/{userId}`).
   * @param imgUrl New absolute URL to the avatar image.
   * @returns Promise that resolves when the update completes.
   */
  async updateImgUrl(userId: string, imgUrl: string) {
    await this.data.updateImgUrl(userId, imgUrl);
  }

  /**
   * Returns a reactive, read-only computed signal indicating whether the
   * provided `user()` is the same as the current user.
   *
   * The computation tracks both the supplied `user()` accessor and
   * `this.currentUserSig()`, and re-evaluates automatically when either changes.
   *
   * @param user - A function that returns a `User` (or `null`/`undefined`) when called.
   * @returns A computed read-only signal (accessor) that yields `true` if both users exist
   *          and their `id` fields match; otherwise `false`.
   */
  isCurrentUser(user: () => User | null | undefined) {
    return computed(() => {
      const u = user();
      const me = this.currentUserSig();
      return !!u && !!me && u.id === me.id;
    });
  }

  /**
   * Performs a one-off, non-reactive check to determine whether the given
   * `user` is the current user.
   *
   * Unlike {@link isCurrentUser}, this method returns a plain boolean and does not
   * subscribe to changes of the current user or the argument.
   *
   * @param user - A `User` instance (or `null`/`undefined`) to compare.
   * @returns `true` if both `user` and the current user exist and their `id` fields match;
   *          otherwise `false`.
   */
  isCurrentUserValue(user: User | null | undefined): boolean {
    const me = this.currentUserSig();
    return !!user && !!me && user.id === me.id;
  }
}
