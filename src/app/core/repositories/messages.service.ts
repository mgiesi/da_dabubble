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
   * Adds an emoji reaction to a message
   */
  async addReactionToMessage(
    channelId: string,
    topicId: string,
    messageId: string,
    emoji: string,
    userId: string
  ): Promise<void> {
    const messageRef = doc(this.fs, `channels/${channelId}/topics/${topicId}/messages/${messageId}`)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) return

    const currentReactions = messageDoc.data()['reactions'] || {}

    // Toggle-Logik: User schon da? → entfernen, sonst → hinzufügen
    if (currentReactions[emoji]?.users?.includes(userId)) {
      currentReactions[emoji].users = currentReactions[emoji].users.filter((id: string) => id !== userId)
      currentReactions[emoji].count = currentReactions[emoji].users.length

      if (currentReactions[emoji].count === 0) {
        delete currentReactions[emoji]
      }
    } else {
      if (!currentReactions[emoji]) {
        currentReactions[emoji] = { count: 0, users: [] }
      }
      currentReactions[emoji].users.push(userId)
      currentReactions[emoji].count = currentReactions[emoji].users.length
    }

    await updateDoc(messageRef, { reactions: currentReactions })
  }
}