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
import { Observable, map } from 'rxjs';
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

  /**
   * Gets direct messages between two users
   */
  getDMMessages$(userId1: string, userId2: string): Observable<DirectMessage[]> {
    return new Observable(observer => {
      this.normalizeToAuthUid(userId1).then(normalizedUserId1 => {
        return this.normalizeToAuthUid(userId2).then(normalizedUserId2 => {
          const dmId = this.createDMId(normalizedUserId1, normalizedUserId2);
          
          console.log('🔍 Repository Debug - getDMMessages$:');
          console.log('Input User1:', userId1, '→ Auth UID:', normalizedUserId1);
          console.log('Input User2:', userId2, '→ Auth UID:', normalizedUserId2);
          console.log('Generated DM ID:', dmId);
          console.log('Firestore Path:', `direct-messages/${dmId}/chat-messages`);

          const subscription = this.firestoreHelper.authedCollection$<any>(() => {
            const ref = collection(this.fs, 'direct-messages', dmId, 'chat-messages');
            return query(ref, orderBy('timestamp', 'asc'));
          }).pipe(
            map(rows => {
              console.log('📦 Raw messages from Firestore:', rows);
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
      const userDoc = await getDoc(doc(this.fs, 'users', userIdOrDocId));
      if (userDoc.exists()) {
        const authUid = userDoc.data()?.['uid'];
        if (authUid) {
          console.log(`🔄 Normalized Document ID ${userIdOrDocId} → Auth UID ${authUid}`);
          return authUid;
        }
      }
    } catch (error) {
      console.warn('Failed to lookup user document:', error);
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
    return runInInjectionContext(this.injector, async () => {
      const normalizedUserId1 = await this.normalizeToAuthUid(userId1);
      const normalizedUserId2 = await this.normalizeToAuthUid(userId2);
      const dmId = this.createDMId(normalizedUserId1, normalizedUserId2);
      const ref = collection(this.fs, 'direct-messages', dmId, 'chat-messages');

      await addDoc(ref, {
        ...messageData,
        timestamp: serverTimestamp(),
        dmId: dmId
      });
    });
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
    return runInInjectionContext(this.injector, async () => {
      const messageRef = doc(this.fs, 'direct-messages', dmId, 'chat-messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) return;

      const currentReactions = messageSnap.data()?.['reactions'] || {};
      const updatedReactions = this.updateReactions(currentReactions, emoji, userId);

      await updateDoc(messageRef, { reactions: updatedReactions });
    });
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
    return runInInjectionContext(this.injector, async () => {
      const normalizedUserId1 = await this.normalizeToAuthUid(userId1);
      const normalizedUserId2 = await this.normalizeToAuthUid(userId2);
      const dmId = this.createDMId(normalizedUserId1, normalizedUserId2);
      const conversationRef = doc(this.fs, 'direct-messages', dmId);
      const conversationSnap = await getDoc(conversationRef);

      if (!conversationSnap.exists()) {
        await setDoc(conversationRef, {
          participants: [normalizedUserId1, normalizedUserId2],
          createdAt: serverTimestamp(),
          lastMessageAt: serverTimestamp(),
        });
      }

      return dmId;
    });
  }
}