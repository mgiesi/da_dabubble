import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  Firestore,
  query,
  collection,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  collectionGroup,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collectionData,
} from '@angular/fire/firestore';
import { Observable, defer } from 'rxjs';
import type { Message, Topic } from '../facades/messages-facade.service';

/**
 * Repository service for message-related database operations.
 * Handles all Firestore interactions for messages and topics.
 */
@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private fs = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Gets all topics for a channel as Observable
   */
  getTopicsForChannel$(channelId: string): Observable<Topic[]> {
    return defer(() =>
      runInInjectionContext(this.injector, () => {
        const topicsRef = collection(this.fs, `channels/${channelId}/topics`);
        const topicsQuery = query(topicsRef, orderBy('lastMessageAt', 'desc'));
        return new Observable<Topic[]>((observer) => {
          const unsubscribe = onSnapshot(topicsQuery, (snapshot) => {
            const topics: Topic[] = [];
            snapshot.forEach((doc) => {
              topics.push({
                id: doc.id,
                channelId,
                ...doc.data(),
              } as Topic);
            });
            observer.next(topics);
          });
          return unsubscribe;
        });
      })
    ) as Observable<Topic[]>;
  }

  /**
   * Gets all messages for a specific topic as Observable
   */
  getMessagesForTopic$(
    channelId: string,
    topicId: string
  ): Observable<Message[]> {
    return defer(() =>
      runInInjectionContext(this.injector, () => {
        const messagesRef = collection(
          this.fs,
          `channels/${channelId}/topics/${topicId}/messages`
        );
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
        return new Observable<Message[]>((observer) => {
          const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messages: Message[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              messages.push({
                id: doc.id,
                channelId,
                topicId,
                ...data,
                timestamp: data['timestamp']?.toDate() || new Date(),
              } as Message);
            });
            observer.next(messages);
          });
          return unsubscribe;
        });
      })
    ) as Observable<Message[]>;
  }

  /**
   * Creates a new message in a topic
   */
  async createMessage(
    channelId: string,
    topicId: string,
    messageData: Partial<Message>
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const messagesRef = collection(
        this.fs,
        `channels/${channelId}/topics/${topicId}/messages`
      );
      await addDoc(messagesRef, {
        ...messageData,
        timestamp: serverTimestamp(),
        channelId,
        topicId,
      });
    });
  }

  /**
   * Creates a default topic for a channel
   */
  async createDefaultTopic(
    channelId: string,
    name: string = 'General'
  ): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const topicsRef = collection(this.fs, `channels/${channelId}/topics`);
      const topicDoc = await addDoc(topicsRef, {
        name,
        channelId,
        messageCount: 0,
        lastMessageAt: serverTimestamp(),
      });
      return topicDoc.id;
    });
  }

  /**
   * Adds/removes emoji reaction with single-emoji-per-user logic
   */
  async addReactionToMessage(
    channelId: string,
    topicId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const messageRef = this.getMessageRef(channelId, topicId, messageId);
      const messageDoc = await getDoc(messageRef);
      if (!messageDoc.exists()) return;
      const currentReactions = messageDoc.data()['reactions'] || {};
      const updatedReactions = this.updateUserEmojiReaction(
        currentReactions,
        emoji,
        userId
      );
      await updateDoc(messageRef, { reactions: updatedReactions });
    });
  }

  /**
   * Gets message document reference
   */
  private getMessageRef(channelId: string, topicId: string, messageId: string) {
    return doc(
      this.fs,
      `channels/${channelId}/topics/${topicId}/messages/${messageId}`
    );
  }

  /**
   * Updates user emoji reaction with single-emoji-per-user logic
   */
  private updateUserEmojiReaction(
    reactions: any,
    newEmoji: string,
    userId: string
  ): any {
    const updatedReactions = { ...reactions };

    // Remove user from any existing emoji
    this.removeUserFromAllEmojis(updatedReactions, userId);

    // Add user to new emoji (if different from their previous one)
    const hadThisEmoji = reactions[newEmoji]?.users?.includes(userId);
    if (!hadThisEmoji) {
      this.addUserToEmoji(updatedReactions, newEmoji, userId);
    }

    return updatedReactions;
  }

  /**
   * Removes user from all emoji reactions
   */
  private removeUserFromAllEmojis(reactions: any, userId: string): void {
    Object.keys(reactions).forEach((emoji) => {
      const reaction = reactions[emoji];
      if (reaction?.users?.includes(userId)) {
        reaction.users = reaction.users.filter((id: string) => id !== userId);
        reaction.count = reaction.users.length;

        if (reaction.count === 0) {
          delete reactions[emoji];
        }
      }
    });
  }

  /**
   * Adds user to specific emoji reaction
   */
  private addUserToEmoji(reactions: any, emoji: string, userId: string): void {
    if (!reactions[emoji]) {
      reactions[emoji] = { count: 0, users: [] };
    }

    reactions[emoji].users.push(userId);
    reactions[emoji].count = reactions[emoji].users.length;
  }

  /**
   * Migrates old reaction format to new format
   */
  async migrateOldReactions(): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const channelsRef = collection(this.fs, 'channels');
      const channelsSnap = await getDocs(channelsRef);
      for (const channelDoc of channelsSnap.docs) {
        await this.migrateChannelReactions(channelDoc.id);
      }
    });
  }

  /**
   * Migrates reactions for single channel
   */
  private async migrateChannelReactions(channelId: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const topicsRef = collection(this.fs, `channels/${channelId}/topics`);
      const topicsSnap = await getDocs(topicsRef);
      for (const topicDoc of topicsSnap.docs) {
        await this.migrateTopicReactions(channelId, topicDoc.id);
      }
    });
  }

  /**
   * Migrates reactions for single topic
   */
  private async migrateTopicReactions(
    channelId: string,
    topicId: string
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const messagesRef = collection(
        this.fs,
        `channels/${channelId}/topics/${topicId}/messages`
      );
      const messagesSnap = await getDocs(messagesRef);
      for (const messageDoc of messagesSnap.docs) {
        await this.migrateMessageReactions(messageDoc);
      }
    });
  }

  /**
   * Migrates reactions for single message
   */
  private async migrateMessageReactions(messageDoc: any): Promise<void> {
    const data = messageDoc.data();

    if (Array.isArray(data['reactions']) && data['reactions'].length > 0) {
      const newReactions = this.convertOldReactionsFormat(data['reactions']);
      await updateDoc(messageDoc.ref, { reactions: newReactions });
    }
  }

  /**
   * Converts old array format to new object format
   */
  private convertOldReactionsFormat(oldReactions: any[]): any {
    const newReactions: any = {};

    oldReactions.forEach((r: any) => {
      if (!newReactions[r.emoji]) {
        newReactions[r.emoji] = { count: 0, users: [] };
      }
      if (!newReactions[r.emoji].users.includes(r.userId)) {
        newReactions[r.emoji].users.push(r.userId);
        newReactions[r.emoji].count = newReactions[r.emoji].users.length;
      }
    });

    return newReactions;
  }

  /**
 * Gets direct messages between two users
 */
  getDMMessages$(userId1: string, userId2: string): Observable<Message[]> {
    const dmId = this.createDMId(userId1, userId2);

    return runInInjectionContext(this.injector, () => {
      const ref = collection(this.fs, 'directMessages', dmId, 'messages');
      const q = query(ref, orderBy('timestamp', 'asc'));
      return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
    });
  }

  /**
   * Creates consistent DM ID from two user IDs
   */
  private createDMId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  /**
 * Creates a direct message between two users
 */
  async createDMMessage(userId1: string, userId2: string, messageData: Partial<Message>): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const dmId = this.createDMId(userId1, userId2);
      const ref = collection(this.fs, 'directMessages', dmId, 'messages');

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
  async addReactionToDMMessage(dmId: string, messageId: string, emoji: string, userId: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const messageRef = doc(this.fs, 'directMessages', dmId, 'messages', messageId);
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
}
