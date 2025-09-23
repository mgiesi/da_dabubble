import { Component, Input, inject, ViewChild, ElementRef } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { NgFor, NgIf } from "@angular/common"
import { BehaviorSubject, combineLatest, Observable } from "rxjs"
import { map } from "rxjs/operators"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import { UsersService } from "../../../core/repositories/users.service"
import { ChannelsService } from "../../../core/repositories/channels.service"

@Component({
  selector: "app-message-input",
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: "./message-input.component.html",
  styleUrl: "./message-input.component.scss",
})
export class MessageInputComponent {
  @Input() channelId: string | null = null
  @Input() topicId: string | null = null
  @Input() parentMessageId: string | null = null
  @Input() parentMessage: any = null 
  @Input() placeholder = "Nachricht schreiben..."
  @Input() userId: string | null = null
  @Input() isDM: boolean = false

  @ViewChild('messageTextarea', { static: false })
  messageTextarea?: ElementRef<HTMLTextAreaElement>

  messageText = ""
  showDropdown = false
  private searchInput$ = new BehaviorSubject<string>('')

  private messagesFacade = inject(MessagesFacadeService)
  private usersService = inject(UsersService)
  private channelsService = inject(ChannelsService)

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.onSendMessage()
    }
  }

  async onSendMessage() {
    if (!this.messageText.trim()) return;

    try {
      if (this.isDM && this.userId) {
        await this.sendDMMessage();
      } else if (this.channelId) {
        if (this.parentMessageId) {
          await this.sendThreadReply();
        } else {
          await this.sendChannelMessage();
        }
      } else {
        console.error("No channel or user selected");
        return;
      }

      this.messageText = "";
    } catch (error) {
      console.error("Failed to send message:", error);
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
      activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
    } else {
    }

    await this.messagesFacade.sendMessage(
      this.channelId,
      activeTopicId,
      this.messageText,
      this.parentMessageId
    )

  }

  /**
   * Sends a regular channel message.
   */
  private async sendChannelMessage() {
    if (!this.channelId) return

    let activeTopicId = this.topicId

    if (!activeTopicId) {
      activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
    }

    await this.messagesFacade.sendMessage(this.channelId, activeTopicId, this.messageText)
  }

  /**
 * Sends direct message
 */
private async sendDMMessage() {
  if (!this.userId) return;
  
  await this.messagesFacade.sendDMMessage(this.userId, this.messageText);
}
}