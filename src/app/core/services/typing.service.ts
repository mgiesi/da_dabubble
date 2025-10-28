import { Injectable, inject } from '@angular/core';
import { Firestore, doc, setDoc, deleteDoc, collection, query, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TypingService {
  private fs = inject(Firestore);
  private readonly TYPING_COLLECTION = 'typing';
  private typingTimeouts = new Map<string, any>();

  /**
   * Setzt User als typing in Firestore
   */
  async setTyping(userId: string): Promise<void> {
    const typingRef = doc(this.fs, this.TYPING_COLLECTION, userId);
    await setDoc(typingRef, {
      userId,
      timestamp: Date.now()
    });

    if (this.typingTimeouts.has(userId)) {
      clearTimeout(this.typingTimeouts.get(userId));
    }

    const timeout = setTimeout(() => {
      this.removeTyping(userId);
    }, 3000);

    this.typingTimeouts.set(userId, timeout);
  }

  /**
   * Entfernt User aus typing in Firestore
   */
  async removeTyping(userId: string): Promise<void> {
    if (this.typingTimeouts.has(userId)) {
      clearTimeout(this.typingTimeouts.get(userId));
      this.typingTimeouts.delete(userId);
    }

    const typingRef = doc(this.fs, this.TYPING_COLLECTION, userId);
    try {
      await deleteDoc(typingRef);
    } catch (error) {
      // Dokument existiert nicht - kein Problem
    }
  }

  /**
   * Observable für alle typing User-IDs
   */
  getTypingUsers$(): Observable<Set<string>> {
    const typingCollection = collection(this.fs, this.TYPING_COLLECTION);
    const typingQuery = query(typingCollection);

    return collectionData(typingQuery, { idField: 'id' }).pipe(
      map((docs: any[]) => {
        const now = Date.now();
        const validUsers = docs.filter(doc => (now - doc.timestamp) < 5000);
        return new Set(validUsers.map(doc => doc.userId));
      })
    );
  }

  /**
   * Prüft ob ein bestimmter User tippt
   */
  isUserTyping$(userId: string): Observable<boolean> {
    return this.getTypingUsers$().pipe(
      map(typingUsers => typingUsers.has(userId))
    );
  }
}