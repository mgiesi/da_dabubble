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
  async sendMessage(channelId: string, topicId: string, messageText: string): Promise<void> {
    try {
      const currentUser = this.auth.currentUser
      if (!currentUser) {
        throw new Error("User must be logged in to send messages")
      }

      await this.messagesRepo.createMessage(channelId, topicId, {
        text: messageText,
        senderId: currentUser.uid,
        reactions: [],
      })

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
   * Returns all messages from all topics in a channel
   */
  subscribeToChannelMessages(channelId: string, callback: (messages: Message[]) => void): () => void {
    console.log(`[v3] Starting subscription for channel ${channelId}`)

    const subscription = this.messagesRepo.getTopicsForChannel$(channelId)
      .pipe(
        switchMap((topics: Topic[]) => {
          console.log(`[v3] Found ${topics.length} topics`)
          
          if (topics.length === 0) {
            // No topics, return empty messages
            return new Observable<Message[]>(observer => observer.next([]))
          }

          // Get messages from all topics
          const messageStreams: Observable<Message[]>[] = topics
            .filter(topic => topic.id) // Only topics with valid IDs
            .map((topic) => this.messagesRepo.getMessagesForTopic$(channelId, topic.id!))

          if (messageStreams.length === 0) {
            return new Observable<Message[]>(observer => observer.next([]))
          }

          // Combine all message streams
          return combineLatest(messageStreams).pipe(
            map((topicMessages: Message[][]) => {
              const allMessages: Message[] = []
              topicMessages.forEach((messages: Message[]) => {
                allMessages.push(...messages)
              })
              
              // Sort by timestamp
              return allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            })
          )
        })
      )
      .subscribe((messages: Message[]) => {
        console.log(`[v3] Received ${messages.length} messages`)
        callback(messages)
      })

    return () => {
      console.log(`[v3] Cleaning up subscription`)
      subscription.unsubscribe()
    }
  }
}