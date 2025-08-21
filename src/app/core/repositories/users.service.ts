import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, collectionData, addDoc, serverTimestamp, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user';

@Injectable({
  providedIn: 'root'
})
/**
 * UsersService encapsulates Firestore CRUD operations for the `users` collection.
 *
 * Exposes a reactive `users$()` stream sorted by `displayName` and
 * provides helpers to create users and update profile fields.
 *
 * Notes:
 * - Timestamps use Firestore `serverTimestamp()` to avoid client clock drift.
 * - `collectionData(..., { idField: 'id' })` hydrates the document ID into `user.id`.
 */
export class UsersService {
  private fs = inject(Firestore);
  
  constructor() { }

  /**
   * Returns a live stream of all users ordered by `displayName` ascending.
   *
   * Each emission reflects real-time updates from Firestore.
   * The document ID is mapped to the `id` property on each `User`.
   *
   * @returns Observable that emits arrays of `User` documents.
   */
  users$(): Observable<User[]> {
    const ref = collection(this.fs, 'users');
    const q = query(ref, orderBy('displayName', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  /**
   * Creates a new user document in the `users` collection.
   *
   * Sets `createdAt` and `lastSeenAt` using `serverTimestamp()` so the server
   * determines the time. Add other required fields from your `User` model as needed.
   *
   * @param uid Firebase Authentication UID.
   * @param email Primary email address.
   * @param displayName Human-friendly display name.
   * @param imgUrl Absolute URL for the user's avatar image.
   * @returns Promise that resolves when the document is written.
   */
  async createUser(uid: string, email: string, displayName: string, imgUrl: string) {
    const ref = collection(this.fs, 'users');
    await addDoc(ref, {
      uid,
      displayName,
      email,
      imgUrl,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp()
    } as User);
  }

  /**
   * Updates the `displayName` of an existing user document and stamps `updatedAt`.
   *
   * @param userId Firestore document ID of the user (i.e., `users/{userId}`).
   * @param displayName New display name to persist.
   * @returns Promise that resolves when the update completes.
   */
  async updateDisplayName(userId: string, displayName: string) {
    const ref = doc(this.fs, `users/${userId}`);
    await updateDoc(ref, { displayName: displayName, updatedAt: serverTimestamp() });
  }

  /**
   * Updates the `imgUrl` (avatar) of an existing user document and stamps `updatedAt`.
   *
   * @param userId Firestore document ID of the user (i.e., `users/{userId}`).
   * @param imgUrl New absolute URL for the avatar image.
   * @returns Promise that resolves when the update completes.
   */
  async updateImgUrl(userId: string, imgUrl: string) {
    const ref = doc(this.fs, `users/${userId}`);
    await updateDoc(ref, { imgUrl: imgUrl, updatedAt: serverTimestamp() });
  }
}
