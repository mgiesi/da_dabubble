import { Injectable, inject, Injector, runInInjectionContext } from "@angular/core"
import { Auth } from "@angular/fire/auth"
import { combineLatest, map, switchMap, Observable } from "rxjs"
import { MessagesService } from "../repositories/messages.service"
import type { ChannelMessage, Topic } from "../../shared/models/channel-message"

@Injectable({
  providedIn: "root",
})
export class MessagesFacadeService {
  private messagesRepo = inject(MessagesService)
  private auth = inject(Auth)
  private injector = inject(Injector)

  /**
   * Sends message to channel/topic
   */
  async sendMessage(channelId: string, topicId: string, messageText: string, parentMessageId?: string): Promise<void> {
    const currentUser = this.getCurrentUser()
    const messageData = this.createMessageData(messageText, currentUser.uid, parentMessageId)

    try {
      await this.messagesRepo.createMessage(channelId, topicId, messageData)
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  /**
   * Updates an existing message text
   */
  async updateMessage(channelId: string, topicId: string, messageId: string, newText: string): Promise<void> {
    try {
      await this.messagesRepo.updateMessageText(channelId, topicId, messageId, newText)
    } catch (error) {
      console.error("Error updating message:", error)
      throw error
    }
  }

  /**
   * Deletes an existing message
   */
  async deleteMessage(channelId: string, topicId: string, messageId: string): Promise<void> {
    try {
      await this.messagesRepo.deleteMessage(channelId, topicId, messageId)
    } catch (error) {
      console.error("Error deleting message:", error)
      throw error
    }
  }

  /**
   * Creates default topic for channel
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
   * Subscribes to channel messages with thread counts
   */
  subscribeToChannelMessages(channelId: string, callback: (messages: ChannelMessage[]) => void): () => void {
    let subscription: any
    runInInjectionContext(this.injector, () => {
      subscription = this.messagesRepo
        .getTopicsForChannel$(channelId)
        .pipe(switchMap((topics) => this.getMainMessagesStream(channelId, topics)))
        .subscribe((messages) => {
          const messagesWithOwnership = this.addOwnershipToMessages(messages)
          callback(messagesWithOwnership)
        })
    })
    return () => subscription.unsubscribe()
  }

  /**
   * Subscribes to thread messages for parent
   */
  subscribeToThreadMessages(
    channelId: string,
    parentMessageId: string,
    callback: (messages: ChannelMessage[]) => void,
  ): () => void {
    const subscription = this.messagesRepo
      .getTopicsForChannel$(channelId)
      .pipe(switchMap((topics) => this.getThreadMessagesStream(channelId, topics, parentMessageId)))
      .subscribe((messages) => {
        const messagesWithOwnership = this.addOwnershipToMessages(messages)
        callback(messagesWithOwnership)
      })

    return () => subscription.unsubscribe()
  }

  /**
   * Subscribes to a specific parent message for real-time updates (e.g., reactions)
   */
  subscribeToParentMessage(
    channelId: string,
    topicId: string,
    messageId: string,
    callback: (message: ChannelMessage | null) => void,
  ): () => void {
    const subscription = this.messagesRepo
      .getMessagesForTopic$(channelId, topicId)
      .pipe(map((messages) => messages.find((m) => m.id === messageId) || null))
      .subscribe((message) => {
        if (message) {
          const messagesWithOwnership = this.addOwnershipToMessages([message])
          callback(messagesWithOwnership[0])
        } else {
          callback(null)
        }
      })

    return () => subscription.unsubscribe()
  }

  /**
   * Adds emoji reaction with single-emoji-per-user logic
   */
  async addReaction(channelId: string, topicId: string, messageId: string, emoji: string): Promise<void> {
    const currentUser = this.getCurrentUser()

    try {
      await this.messagesRepo.addReactionToMessage(channelId, topicId, messageId, emoji, currentUser.uid)
    } catch (error) {
      console.error("Failed to add reaction:", error)
      throw error
    }
  }

  /**
   * Gets current authenticated user
   */
  private getCurrentUser() {
    const currentUser = this.auth.currentUser
    if (!currentUser) {
      throw new Error("User must be logged in")
    }
    return currentUser
  }

  /**
   * Creates message data object
   */
  private createMessageData(text: string, senderId: string, parentMessageId?: string): Partial<ChannelMessage> {
    const messageData: Partial<ChannelMessage> = {
      text,
      senderId,
      reactions: {},
    }

    if (parentMessageId) {
      messageData.parentMessageId = parentMessageId
    }

    return messageData
  }

  /**
   * Gets main messages stream with thread counts
   */
  private getMainMessagesStream(channelId: string, topics: Topic[]): Observable<ChannelMessage[]> {
    if (topics.length === 0) {
      return new Observable<ChannelMessage[]>((observer) => observer.next([]))
    }

    const messageStreams = topics
      .filter((topic) => topic.id)
      .map((topic) => this.messagesRepo.getMessagesForTopic$(channelId, topic.id!))

    return combineLatest(messageStreams).pipe(map((topicMessages) => this.processMainMessages(topicMessages)))
  }

  /**
   * Gets thread messages stream for parent
   */
  private getThreadMessagesStream(
    channelId: string,
    topics: Topic[],
    parentMessageId: string,
  ): Observable<ChannelMessage[]> {
    if (topics.length === 0) {
      return new Observable<ChannelMessage[]>((observer) => observer.next([]))
    }

    const messageStreams = topics
      .filter((topic) => topic.id)
      .map((topic) => this.messagesRepo.getMessagesForTopic$(channelId, topic.id!))

    return combineLatest(messageStreams).pipe(
      map((topicMessages) => this.processThreadMessages(topicMessages, parentMessageId)),
    )
  }

  /**
   * Processes main messages and adds thread counts
   */
  private processMainMessages(topicMessages: ChannelMessage[][]): ChannelMessage[] {
    const allMessages: ChannelMessage[] = []
    topicMessages.forEach((messages) => allMessages.push(...messages))

    const mainMessages = allMessages
      .filter((message) => !message.parentMessageId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return this.addThreadCounts(allMessages, mainMessages)
  }

  /**
   * Processes thread messages for parent
   */
  private processThreadMessages(topicMessages: ChannelMessage[][], parentMessageId: string): ChannelMessage[] {
    const allMessages: ChannelMessage[] = []
    topicMessages.forEach((messages) => allMessages.push(...messages))

    return allMessages
      .filter((message) => message.parentMessageId === parentMessageId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  /**
   * Adds thread counts to messages
   */
  private addThreadCounts(allMessages: ChannelMessage[], mainMessages: ChannelMessage[]): ChannelMessage[] {
    return mainMessages.map((message) => ({
      ...message,
      threadCount: allMessages.filter((m) => m.parentMessageId === message.id).length,
    }))
  }

  /**
   * Adds ownership flag to messages
   */
  private addOwnershipToMessages(messages: ChannelMessage[]): ChannelMessage[] {
    const currentUserId = this.auth.currentUser?.uid

    return messages.map((message) => ({
      ...message,
      isOwnMessage: message.senderId === currentUserId,
    }))
  }
}