import { inject, Injectable } from '@angular/core';
import { UsersService } from '../repositories/users.service';
import { Auth } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

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

  /**
   * Reactive list of users as an Angular **Signal**.
   *
   * Backed by Firestore in real time (sorted by `displayName` in `UsersService`).
   * The signal updates automatically as the underlying data changes.
   */
  readonly users = toSignal(
    this.data.users$(), {
    initialValue: [] as any[]
  }
  );

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
}
