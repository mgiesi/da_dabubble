import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, collectionData, addDoc, serverTimestamp, doc, updateDoc, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user';

/**
 * Service for managing user-related operations in Firestore.
 * Handles user data retrieval and user creation functionality.
 * Provides reactive streams for user data with real-time updates.
 */
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private fs = inject(Firestore);

  constructor() { }

  /**
   * Returns an observable stream of all users ordered by display name.
   * The stream updates automatically when user data changes in Firestore.
   * 
   * @returns Observable that emits an array of User objects
   */
  users$(): Observable<User[]> {
    const ref = collection(this.fs, 'users');
    const q = query(ref, orderBy('displayName', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  /**
   * Creates a new user document in Firestore.
   * Sets creation and last seen timestamps using server time.
   * 
   * @param uid - Firebase Authentication UID
   * @param email - User's email address
   * @param displayName - User's display name
   * @param imgUrl - URL to user's profile image
   * @returns Promise that resolves when the user is created
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
}