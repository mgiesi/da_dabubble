import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Firestore,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
} from '@angular/fire/firestore';
import { Observable, last, map, partition } from 'rxjs';
import { DirectMessage, DirectMessageConversation } from '../../shared/models/direct-message';
import { FirestoreHelpers } from '../firebase/firestore-helper';
import { UsersFacadeService } from '../facades/users-facade.service';

/**
 * Repository service for direct message operations.
 * Handles Firestore interactions for direct messages only.
 */
@Injectable({
  providedIn: 'root'
})
export class DirectMessagesService {
  private fs = inject(Firestore);
  private injector = inject(Injector);
  private firestoreHelper = inject(FirestoreHelpers);
  private usersFacade = inject(UsersFacadeService);

  private inCtx<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }

  /**
   * Gets direct messages between two users
   */
  getDMMessages$(userId1: string, userId2: string): Observable<DirectMessage[]> {
    return new Observable(observer => {
      this.normalizeToAuthUid(userId1).then(normalizedUserId1 => {
        return this.normalizeToAuthUid(userId2).then(normalizedUserId2 => {
          const dmId = this.createDMId(normalizedUserId1, normalizedUserId2);

          const subscription = this.firestoreHelper.authedCollection$<any>(() => {
            const ref = collection(this.fs, 'direct-messages', dmId, 'chat-messages');
            return query(ref, orderBy('timestamp', 'asc'));
          }).pipe(
            map(rows => {
              return rows.map(r => ({
                ...r,
                timestamp: r.timestamp?.toDate?.() ?? new Date(),
              } as DirectMessage));
            })
          ).subscribe(observer);

          return () => subscription.unsubscribe();
        });
      }).catch(error => observer.error(error));
    });
  }

  /**
   * Creates consistent DM ID from two user IDs
   */
  private createDMId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Normalizes any user identifier to Firebase Auth UID
   */
  private async normalizeToAuthUid(userIdOrDocId: string): Promise<string> {
    // Check if it's already an Auth UID (Firebase Auth UIDs are typically 28 chars)
    if (this.isAuthUid(userIdOrDocId)) {
      return userIdOrDocId;
    }

    // It's likely a Document ID, lookup the Auth UID
    try {
      const ref = this.inCtx(() => doc(this.fs, 'users', userIdOrDocId));
      const snap = await this.inCtx(() => getDoc(ref));
        
      if (snap.exists()) {
        const data = snap.data() as { uid?: string } | undefined;
        if (data?.uid) return data.uid;
      }
    } catch (error) {
      console.warn('normalizeToAuthUid failed', error);
    }

    // Fallback: return as-is
    return userIdOrDocId;
  }

  /**
   * Checks if a string looks like a Firebase Auth UID
   */
  private isAuthUid(id: string): boolean {
    // Firebase Auth UIDs are typically 28 characters and contain specific patterns
    return id.length === 28 && /^[a-zA-Z0-9]+$/.test(id);
  }

  /**
   * Creates a direct message between two users
   */
  async createDMMessage(
    userId1: string,
    userId2: string,
    messageData: Partial<DirectMessage>
  ): Promise<void> {
    const normalizedUserId1 = await this.normalizeToAuthUid(userId1);
    const normalizedUserId2 = await this.normalizeToAuthUid(userId2);
    const dmId = this.createDMId(normalizedUserId1, normalizedUserId2);
    const ref = this.inCtx(() => 
      collection(this.fs, 'direct-messages', dmId, 'chat-messages')
    );
    const timestamp = this.inCtx(() => serverTimestamp());

    await this.inCtx(() => 
      addDoc(ref, {
        ...messageData,
        timestamp,
        dmId
      })
    );
  }

  /**
   * Adds reaction to direct message
   */
  async addReactionToDMMessage(
    dmId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const messageRef = this.inCtx(() => 
      doc(this.fs, 'direct-messages', dmId, 'chat-messages', messageId)
    );
    const messageSnap = await this.inCtx(() => getDoc(messageRef));

    if (!messageSnap.exists()) return;

    const data = messageSnap.data() as { reactions?: Record<string, string[]> } | undefined;
    const currentReactions = data?.reactions ?? {};
    const updatedReactions = this.updateReactions(currentReactions, emoji, userId);

    await this.inCtx(() => 
      updateDoc(messageRef, { reactions: updatedReactions })
    );
  }

  /**
   * Updates reactions with single-emoji-per-user logic
   */
  private updateReactions(currentReactions: any, emoji: string, userId: string): any {
    const reactions = { ...currentReactions };

    // Remove user from any existing emoji
    for (const [existingEmoji, data] of Object.entries(reactions)) {
      const entry = data as { users: string[], count: number };
      const userIndex = entry.users.indexOf(userId);
      if (userIndex > -1) {
        entry.users.splice(userIndex, 1);
        entry.count = Math.max(0, entry.count - 1);
        if (entry.count === 0) {
          delete reactions[existingEmoji];
        }
      }
    }

    // Add user to new emoji
    if (!reactions[emoji]) {
      reactions[emoji] = { count: 0, users: [] };
    }

    const entry = reactions[emoji];
    if (!entry.users.includes(userId)) {
      entry.users.push(userId);
      entry.count += 1;
    }

    return reactions;
  }

  /**
   * Creates conversation document if not exists
   */
  async ensureDMConversation(userId1: string, userId2: string): Promise<string> {
    const normalizedUser1 = await this.normalizeToAuthUid(userId1);
    const normalizedUser2 = await this.normalizeToAuthUid(userId2);
    const dmId = this.createDMId(normalizedUser1, normalizedUser2);
    const ref = this.inCtx(() => doc(this.fs, 'direct-messages', dmId));
    const snap = await this.inCtx(() => getDoc(ref));

    if (!snap.exists()) {
      const createAt = this.inCtx(() => serverTimestamp());
      const lastMessageAt = this.inCtx(() => serverTimestamp());
      await this.inCtx(() => 
        setDoc(
          ref,
          {
            partition: [normalizedUser1, normalizedUser2],
            createAt,
            lastMessageAt
          },
          { merge: true }
        )
      );
    }

    return dmId;
  }

  /**
   * Updates the text of a direct message
   */
  async updateDMMessageText(
    dmId: string,
    messageId: string,
    newText: string
  ): Promise<void> {
    const messageRef = this.inCtx(() => 
      doc(this.fs, 'direct-messages', dmId, 'chat-messages', messageId)
    );

    await this.inCtx(() => 
      updateDoc(messageRef, { text: newText })
    );
  }
}