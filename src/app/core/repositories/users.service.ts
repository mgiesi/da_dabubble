import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  orderBy,
  collectionData,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { map, Observable, of, switchMap } from 'rxjs';
import { User } from '../../shared/models/user';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private fs = inject(Firestore);
  private auth = inject(AuthService);

  constructor() {}

  /**
   * Checks if a user with the given email exists in the Firestore users collection.
   * Returns true if found, false otherwise.
   */
  async emailExistsInFirestore(email: string): Promise<boolean> {
    const ref = collection(this.fs, 'users');
    const q = query(ref, where('email', '==', email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }
  // ...existing code...

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
   * Returns the current application user as an observable.
   * First it gets the current user-object from the Firebase authentication. If it
   * exist, it queries the users collection in Firestore for a document whose uid field
   * matches the Firebase user's UID.
   *
   * @returns Observable<User | null> — the current user object from Firestore,
   *          or `null` if not authenticated or no matching record is found.
   */
  currentUser$(): Observable<User | null> {
    return this.auth.user$.pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) {
          return of(null);
        }
        const ref = collection(this.fs, 'users');
        const q = query(ref, where('uid', '==', firebaseUser.uid));
        return collectionData(q, { idField: 'id' }).pipe(
          map((users) => (users[0] as User) ?? null)
        );
      })
    );
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
  async createUser(
    uid: string,
    email: string,
    displayName: string,
    imgUrl: string
  ) {
    const ref = collection(this.fs, 'users');
    await addDoc(ref, {
      uid,
      displayName,
      email,
      imgUrl,
      createdAt: serverTimestamp(),
      lastSeenAt: serverTimestamp(),
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
    await updateDoc(ref, {
      displayName: displayName,
      updatedAt: serverTimestamp(),
    });
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
