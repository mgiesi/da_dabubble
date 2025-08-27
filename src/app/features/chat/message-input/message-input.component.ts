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
      console.log(`[v0] Sending message to channel ${this.channelId}`)

      // If no topicId provided, create or get default topic
      let activeTopicId = this.topicId

      if (!activeTopicId) {
        console.log(`[v0] No topic ID provided, creating default topic`)
        // For now, we'll create a default topic
        // In a real app, you might want to get the first available topic
        activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
        console.log(`[v0] Created default topic: ${activeTopicId}`)
      }

      await this.messagesFacade.sendMessage(this.channelId, activeTopicId, this.messageText)
      console.log(`[v0] Message sent successfully`)
      this.messageText = "" // Clear input after sending
    } catch (error) {
      console.error("Failed to send message:", error)
      // You could show a toast or error message to the user here
    }
  }
}
