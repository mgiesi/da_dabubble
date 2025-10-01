import { Component, Input, inject, ViewChild, ElementRef } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { BehaviorSubject, combineLatest, Observable } from "rxjs"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import { DirectMessagesFacadeService } from "../../../core/facades/direct-messages-facade.service"
import { UsersService } from "../../../core/repositories/users.service"
import { ChannelsService } from "../../../core/repositories/channels.service"

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
  private dmFacade = inject(DirectMessagesFacadeService)
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
      await this.handleSend();
      this.messageText = "";
    } catch (error) {
    }
  }

  private async handleSend() {
    if (this.isDM && this.userId) {
      await this.sendDMMessage();
    } else if (this.channelId) {
      await this.handleChannelSend();
    } else {
    }
  }

  private async handleChannelSend() {
    if (this.parentMessageId) {
      await this.sendThreadReply();
    } else {
      await this.sendChannelMessage();
    }
  }

  /**
   * Sends a reply to a thread (parent message).
   */
  private async sendThreadReply() {
    if (!this.channelId || !this.parentMessageId) return

    let activeTopicId = this.parentMessage?.topicId || this.topicId

    if (!activeTopicId) {
      activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
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
   * Sends direct message using new DM facade
   */
  private async sendDMMessage() {
    if (!this.userId) return;
    
    await this.dmFacade.sendDMMessage(this.userId, this.messageText);
  }
}