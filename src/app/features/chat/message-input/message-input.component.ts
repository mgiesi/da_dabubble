import { Component, Input, inject, ViewChild, ElementRef, Output, EventEmitter, OnChanges, SimpleChanges } from "@angular/core"
import { FormsModule } from "@angular/forms"
import { NgIf } from "@angular/common"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import { DirectMessagesFacadeService } from "../../../core/facades/direct-messages-facade.service"
import { MessageEmojiPickerComponent } from "../message-item/message-emoji-picker/message-emoji-picker.component"

@Component({
  selector: "app-message-input",
  imports: [FormsModule, NgIf, MessageEmojiPickerComponent],
  templateUrl: "./message-input.component.html",
  styleUrl: "./message-input.component.scss",
})
export class MessageInputComponent implements OnChanges {
  @Input() channelId: string | null = null
  @Input() topicId: string | null = null
  @Input() parentMessageId: string | null = null
  @Input() parentMessage: any = null
  @Input() placeholder = "Nachricht schreiben..."
  @Input() userId: string | null = null
  @Input() isDM: boolean = false
  @Input() editingMessage: any = null

  @Output() editComplete = new EventEmitter<void>()

  @ViewChild('messageTextarea', { static: false })
  messageTextarea?: ElementRef<HTMLTextAreaElement>

  messageText = ""
  showEmojiPicker = false

  private messagesFacade = inject(MessagesFacadeService)
  private dmFacade = inject(DirectMessagesFacadeService)

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingMessage'] && this.editingMessage) {
      this.messageText = this.editingMessage.text || ''
    }
  }

  onEmojiPickerToggle(event: MouseEvent) {
    event.stopPropagation()
    this.showEmojiPicker = !this.showEmojiPicker
  }

  onEmojiSelected(emoji: string) {
    this.messageText += emoji
    this.showEmojiPicker = false
  }

  onEmojiPickerClosed() {
    this.showEmojiPicker = false
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.onSendMessage()
    }
  }

  async onSendMessage() {
    if (!this.messageText.trim()) return

    try {
      if (this.editingMessage) {
        await this.handleEdit()
      } else {
        await this.handleSend()
      }
      this.messageText = ""
    } catch (error) {
    }
  }

  private async handleEdit() {
    if (this.isDM && this.userId) {
      console.log('Edit DM not yet implemented')
    } else if (this.channelId && this.editingMessage.id) {
      await this.messagesFacade.updateMessage(
        this.channelId,
        this.editingMessage.topicId,
        this.editingMessage.id,
        this.messageText
      )
    }
    this.editComplete.emit()
  }

  cancelEdit() {
    this.messageText = ''
    this.editComplete.emit()
  }

  private async handleSend() {
    if (this.isDM && this.userId) {
      await this.sendDMMessage()
    } else if (this.channelId) {
      await this.handleChannelSend()
    }
  }

  private async handleChannelSend() {
    if (this.parentMessageId) {
      await this.sendThreadReply()
    } else {
      await this.sendChannelMessage()
    }
  }

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

  private async sendChannelMessage() {
    if (!this.channelId) return

    let activeTopicId = this.topicId
    if (!activeTopicId) {
      activeTopicId = await this.messagesFacade.createDefaultTopic(this.channelId)
    }

    await this.messagesFacade.sendMessage(this.channelId, activeTopicId, this.messageText)
  }

  private async sendDMMessage() {
    if (!this.userId) return
    await this.dmFacade.sendDMMessage(this.userId, this.messageText)
  }
}