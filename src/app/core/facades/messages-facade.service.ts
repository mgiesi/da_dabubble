import { Injectable, inject } from "@angular/core"
import { Auth } from "@angular/fire/auth"
import { combineLatest, map, switchMap, Observable } from "rxjs"
import { MessagesService } from "../repositories/messages.service"

export interface Message {
  id?: string
  text: string
  senderId: string
  timestamp: Date
  topicId: string
  channelId: string
  reactions?: any[]
  threadId?: string
  parentMessageId?: string
  threadCount?: number
  isOwnMessage?: boolean
}

export interface Topic {
  id?: string
  name?: string
  channelId: string
  messageCount?: number
  lastMessageAt?: Date
}

@Injectable({
  providedIn: "root",
})
export class MessagesFacadeService {
  private messagesRepo = inject(MessagesService)
  private auth = inject(Auth)

  /**
   * Sends a new message to a channel/topic
   */
  async sendMessage(channelId: string, topicId: string, messageText: string, parentMessageId?: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser
      if (!currentUser) {
        throw new Error("User must be logged in to send messages")
      }

      const messageData: Partial<Message> = {
        text: messageText,
        senderId: currentUser.uid,
        reactions: [],
      }

      // Add parentMessageId if this is a thread reply
      if (parentMessageId) {
        messageData.parentMessageId = parentMessageId
        console.log(`[Facade] Sending thread reply to parent ${parentMessageId}`)
      }

      await this.messagesRepo.createMessage(channelId, topicId, messageData)
      console.log("Message sent successfully")
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  /**
   * Creates a default topic for a channel if none exists
   */
  async createDefaultTopic(channelId: string): Promise<string> {
    try {
      return await this.messagesRepo.createDefaultTopic(channelId)
    } catch (error) {
      console.error("Error creating default topic:", error)
      throw error
    }
  }

  /**
   * Subscribe to real-time updates for channel messages
   * Returns all messages from all topics in a channel with thread counts
   */
  subscribeToChannelMessages(channelId: string, callback: (messages: Message[]) => void): () => void {
    console.log(`[v3] Starting subscription for channel ${channelId}`)

    const subscription = this.messagesRepo.getTopicsForChannel$(channelId)
      .pipe(
        switchMap((topics: Topic[]) => {
          console.log(`[v3] Found ${topics.length} topics`)

          if (topics.length === 0) {
            return new Observable<Message[]>(observer => observer.next([]))
          }

          const messageStreams: Observable<Message[]>[] = topics
            .filter(topic => topic.id)
            .map((topic) => this.messagesRepo.getMessagesForTopic$(channelId, topic.id!))

          if (messageStreams.length === 0) {
            return new Observable<Message[]>(observer => observer.next([]))
          }

          return combineLatest(messageStreams).pipe(
            map((topicMessages: Message[][]) => {
              const allMessages: Message[] = []
              topicMessages.forEach((messages: Message[]) => {
                allMessages.push(...messages)
              })

              // 🔧 FILTER: Nur Haupt-Messages (keine Thread-Replies)
              const mainMessages = allMessages.filter(message => !message.parentMessageId)

              const sortedMessages = mainMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

              // Add thread counts to each message
              return this.addThreadCounts(allMessages, sortedMessages) // Pass allMessages for counting
            })
          )
        })
      )
      .subscribe((messages: Message[]) => {
        console.log(`[v3] Received ${messages.length} messages`)

        const currentUserId = this.auth.currentUser?.uid
        const messagesWithOwnership = messages.map(message => ({
          ...message,
          isOwnMessage: message.senderId === currentUserId
        }))

        callback(messagesWithOwnership)
      })

    return () => {
      console.log(`[v3] Cleaning up subscription`)
      subscription.unsubscribe()
    }
  }

  /**
   * Subscribe to thread messages for a specific parent message
   * Returns all messages that are replies to the parent message
   */
  subscribeToThreadMessages(channelId: string, parentMessageId: string, callback: (messages: Message[]) => void): () => void {
    console.log(`[Thread] Starting thread subscription for parent ${parentMessageId}`)

    const subscription = this.messagesRepo.getTopicsForChannel$(channelId)
      .pipe(
        switchMap((topics: Topic[]) => {
          if (topics.length === 0) {
            return new Observable<Message[]>(observer => observer.next([]))
          }

          const messageStreams: Observable<Message[]>[] = topics
            .filter(topic => topic.id)
            .map((topic) => this.messagesRepo.getMessagesForTopic$(channelId, topic.id!))

          if (messageStreams.length === 0) {
            return new Observable<Message[]>(observer => observer.next([]))
          }

          return combineLatest(messageStreams).pipe(
            map((topicMessages: Message[][]) => {
              const allMessages: Message[] = []
              topicMessages.forEach((messages: Message[]) => {
                allMessages.push(...messages)
              })

              // Filter for thread replies
              const threadMessages = allMessages.filter(message =>
                message.parentMessageId === parentMessageId
              )

              return threadMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            })
          )
        })
      )
      .subscribe((threadMessages: Message[]) => {
        console.log(`[Thread] Received ${threadMessages.length} thread messages`)

        const currentUserId = this.auth.currentUser?.uid
        const messagesWithOwnership = threadMessages.map(message => ({
          ...message,
          isOwnMessage: message.senderId === currentUserId
        }))

        callback(messagesWithOwnership)
      })

    return () => {
      console.log(`[Thread] Cleaning up thread subscription`)
      subscription.unsubscribe()
    }
  }

  /**
  * Adds thread counts to messages by counting replies for each message
  * @param allMessages - All messages including thread replies for counting
  * @param mainMessages - Only main messages to add counts to
  */
  private addThreadCounts(allMessages: Message[], mainMessages: Message[]): Message[] {
    return mainMessages.map(message => {
      const threadCount = allMessages.filter(m => m.parentMessageId === message.id).length
      return {
        ...message,
        threadCount
      }
    })
  }

  /**
 * Adds emoji reaction to message
 */
  async addReaction(channelId: string, topicId: string, messageId: string, emoji: string): Promise<void> {
    const currentUser = this.auth.currentUser
    if (!currentUser) {
      throw new Error("User must be logged in to react")
    }

    await this.messagesRepo.addReactionToMessage(channelId, topicId, messageId, emoji, currentUser.uid)
  }
}