import { Injectable, inject } from "@angular/core"
import {
  Firestore,
  query,
  collection,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  doc,
  getDoc,
  updateDoc,
  getDocs
} from "@angular/fire/firestore"
import { Observable } from "rxjs"
import type { Message, Topic } from "../facades/messages-facade.service"

/**
 * Repository service for message-related database operations.
 * Handles all Firestore interactions for messages and topics.
 */
@Injectable({
  providedIn: "root",
})
export class MessagesService {
  private fs = inject(Firestore)

  /**
   * Gets all topics for a channel as Observable
   */
  getTopicsForChannel$(channelId: string): Observable<Topic[]> {
    const topicsRef = collection(this.fs, `channels/${channelId}/topics`)
    const topicsQuery = query(topicsRef, orderBy("lastMessageAt", "desc"))

    return new Observable((observer) => {
      const unsubscribe = onSnapshot(topicsQuery, (snapshot) => {
        const topics: Topic[] = []
        snapshot.forEach((doc) => {
          topics.push({
            id: doc.id,
            channelId,
            ...doc.data(),
          } as Topic)
        })
        observer.next(topics)
      })
      return unsubscribe
    })
  }

  /**
   * Gets all messages for a specific topic as Observable
   */
  getMessagesForTopic$(channelId: string, topicId: string): Observable<Message[]> {
    const messagesRef = collection(this.fs, `channels/${channelId}/topics/${topicId}/messages`)
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"))

    return new Observable((observer) => {
      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messages: Message[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          messages.push({
            id: doc.id,
            channelId,
            topicId,
            ...data,
            timestamp: data["timestamp"]?.toDate() || new Date(),
          } as Message)
        })
        observer.next(messages)
      })
      return unsubscribe
    })
  }

  /**
   * Creates a new message in a topic
   */
  async createMessage(channelId: string, topicId: string, messageData: Partial<Message>): Promise<void> {
    const messagesRef = collection(this.fs, `channels/${channelId}/topics/${topicId}/messages`)

    await addDoc(messagesRef, {
      ...messageData,
      timestamp: serverTimestamp(),
      channelId,
      topicId,
    })
  }

  /**
   * Creates a default topic for a channel
   */
  async createDefaultTopic(channelId: string, name: string = "General"): Promise<string> {
    const topicsRef = collection(this.fs, `channels/${channelId}/topics`)

    const topicDoc = await addDoc(topicsRef, {
      name,
      channelId,
      messageCount: 0,
      lastMessageAt: serverTimestamp(),
    })

    return topicDoc.id
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
    const messageRef = this.getMessageRef(channelId, topicId, messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) return

    const currentReactions = messageDoc.data()['reactions'] || {}
    const updatedReactions = this.updateUserEmojiReaction(currentReactions, emoji, userId)

    await updateDoc(messageRef, { reactions: updatedReactions })
  }

  /**
   * Gets message document reference
   */
  private getMessageRef(channelId: string, topicId: string, messageId: string) {
    return doc(this.fs, `channels/${channelId}/topics/${topicId}/messages/${messageId}`)
  }

  /**
   * Updates user emoji reaction with single-emoji-per-user logic
   */
  private updateUserEmojiReaction(reactions: any, newEmoji: string, userId: string): any {
    const updatedReactions = { ...reactions }

    // Remove user from any existing emoji
    this.removeUserFromAllEmojis(updatedReactions, userId)

    // Add user to new emoji (if different from their previous one)
    const hadThisEmoji = reactions[newEmoji]?.users?.includes(userId)
    if (!hadThisEmoji) {
      this.addUserToEmoji(updatedReactions, newEmoji, userId)
    }

    return updatedReactions
  }

  /**
   * Removes user from all emoji reactions
   */
  private removeUserFromAllEmojis(reactions: any, userId: string): void {
    Object.keys(reactions).forEach(emoji => {
      const reaction = reactions[emoji]
      if (reaction?.users?.includes(userId)) {
        reaction.users = reaction.users.filter((id: string) => id !== userId)
        reaction.count = reaction.users.length

        if (reaction.count === 0) {
          delete reactions[emoji]
        }
      }
    })
  }

  /**
   * Adds user to specific emoji reaction
   */
  private addUserToEmoji(reactions: any, emoji: string, userId: string): void {
    if (!reactions[emoji]) {
      reactions[emoji] = { count: 0, users: [] }
    }

    reactions[emoji].users.push(userId)
    reactions[emoji].count = reactions[emoji].users.length
  }

  /**
   * Migrates old reaction format to new format
   */
  async migrateOldReactions(): Promise<void> {
    const channelsRef = collection(this.fs, 'channels')
    const channelsSnap = await getDocs(channelsRef)

    for (const channelDoc of channelsSnap.docs) {
      await this.migrateChannelReactions(channelDoc.id)
    }
  }

  /**
   * Migrates reactions for single channel
   */
  private async migrateChannelReactions(channelId: string): Promise<void> {
    const topicsRef = collection(this.fs, `channels/${channelId}/topics`)
    const topicsSnap = await getDocs(topicsRef)

    for (const topicDoc of topicsSnap.docs) {
      await this.migrateTopicReactions(channelId, topicDoc.id)
    }
  }

  /**
   * Migrates reactions for single topic
   */
  private async migrateTopicReactions(channelId: string, topicId: string): Promise<void> {
    const messagesRef = collection(this.fs, `channels/${channelId}/topics/${topicId}/messages`)
    const messagesSnap = await getDocs(messagesRef)

    for (const messageDoc of messagesSnap.docs) {
      await this.migrateMessageReactions(messageDoc)
    }
  }

  /**
   * Migrates reactions for single message
   */
  private async migrateMessageReactions(messageDoc: any): Promise<void> {
    const data = messageDoc.data()

    if (Array.isArray(data['reactions']) && data['reactions'].length > 0) {
      const newReactions = this.convertOldReactionsFormat(data['reactions'])
      await updateDoc(messageDoc.ref, { reactions: newReactions })
    }
  }

  /**
   * Converts old array format to new object format
   */
  private convertOldReactionsFormat(oldReactions: any[]): any {
    const newReactions: any = {}

    oldReactions.forEach((r: any) => {
      if (!newReactions[r.emoji]) {
        newReactions[r.emoji] = { count: 0, users: [] }
      }
      if (!newReactions[r.emoji].users.includes(r.userId)) {
        newReactions[r.emoji].users.push(r.userId)
        newReactions[r.emoji].count = newReactions[r.emoji].users.length
      }
    })

    return newReactions
  }
}