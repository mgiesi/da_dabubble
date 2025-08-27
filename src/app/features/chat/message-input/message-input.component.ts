import { Component, Input, inject } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"

@Component({
  selector: "app-message-input",
  imports: [FormsModule],
  templateUrl: "./message-input.component.html",
  styleUrl: "./message-input.component.scss",
})
export class MessageInputComponent {
  @Input() channelId: string | null = null
  @Input() topicId: string | null = null
  @Input() parentMessageId: string | null = null
  @Input() parentMessage: any = null  // Neue Property für Parent Message Object
  @Input() placeholder = "Nachricht schreiben..."

  messageText = ""
  private messagesFacade = inject(MessagesFacadeService)

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.onSendMessage()
    }
  }

  async onSendMessage() {
    if (!this.messageText.trim()) return
    if (!this.channelId) {
      console.error("No channel selected")
      return
    }

    try {
      if (this.parentMessageId) {
        console.log(`[Thread] Sending reply to message ${this.parentMessageId} in channel ${this.channelId}`)
        await this.sendThreadReply()
      } else {
        console.log(`[Chat] Sending message to channel ${this.channelId}`)
        await this.sendChannelMessage()
      }
      
      this.messageText = ""
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  /**
   * Sends a reply to a thread (parent message).
   * Uses the parent message's topicId to avoid creating new topics.
   */
  private async sendThreadReply() {
    if (!this.channelId || !this.parentMessageId) return

    // Use parent message's topicId if available, otherwise fall back to provided topicId
    let activeTopicId = this.parentMessage?.topicId || this.topicId
    
    if (!activeTopicId) {
      console.log(`[Thread] No topic ID available, creating default topic`)
      activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
    } else {
      console.log(`[Thread] Using parent message's topic: ${activeTopicId}`)
    }
    
    await this.messagesFacade.sendMessage(
      this.channelId, 
      activeTopicId, 
      this.messageText,
      this.parentMessageId
    )
    
    console.log(`[Thread] Reply sent to thread ${this.parentMessageId}`)
  }

  /**
   * Sends a regular channel message.
   */
  private async sendChannelMessage() {
    if (!this.channelId) return

    let activeTopicId = this.topicId

    if (!activeTopicId) {
      console.log(`[Chat] No topic ID provided, creating default topic`)
      activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
      console.log(`[Chat] Created default topic: ${activeTopicId}`)
    }

    await this.messagesFacade.sendMessage(this.channelId, activeTopicId, this.messageText)
    console.log(`[Chat] Message sent successfully`)
  }
}