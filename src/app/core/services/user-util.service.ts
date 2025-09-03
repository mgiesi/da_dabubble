import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class UserUtilService {
  private fs = inject(Firestore);

  /**
   * Sucht einen User in Firestore anhand der E-Mail und gibt die Document-ID zurück.
   */
  async getUserDocIdByEmail(email: string): Promise<string | null> {
    const ref = collection(this.fs, 'users');
    const q = query(ref, where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    return null;
  }

  /**
   * Setzt die UID für einen User anhand der E-Mail.
   */
  async setUidByEmail(email: string, uid: string): Promise<void> {
    const docId = await this.getUserDocIdByEmail(email);
    if (docId) {
      const ref = doc(this.fs, 'users', docId);
      await updateDoc(ref, { uid });
    }
  }
}
