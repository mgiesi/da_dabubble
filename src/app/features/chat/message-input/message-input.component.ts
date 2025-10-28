import {
  Component,
  Input,
  inject,
  ViewChild,
  type ElementRef,
  Output,
  EventEmitter,
  type OnChanges,
  type SimpleChanges,
  HostListener,
  AfterViewInit,
} from "@angular/core"
import { FormsModule } from "@angular/forms"
import { NgIf, NgFor } from "@angular/common"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import { DirectMessagesFacadeService } from "../../../core/facades/direct-messages-facade.service"
import { MessageEmojiPickerComponent } from "../message-item/message-emoji-picker/message-emoji-picker.component"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service"
import { ProfileAvatarComponent } from "../../profile/profile-avatar/profile-avatar.component"
import { User } from "../../../shared/models/user"
import { TypingService } from "../../../core/services/typing.service"

@Component({
  selector: "app-message-input",
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, MessageEmojiPickerComponent, ProfileAvatarComponent],
  templateUrl: "./message-input.component.html",
  styleUrl: "./message-input.component.scss",
})
export class MessageInputComponent implements OnChanges, AfterViewInit {
  @Input() channelId: string | null = null
  @Input() topicId: string | null = null
  @Input() parentMessageId: string | null = null
  @Input() parentMessage: any = null
  @Input() placeholder = "Nachricht schreiben..."
  @Input() userId: string | null = null
  @Input() isDM = false
  @Input() editingMessage: any = null

  @Output() editComplete = new EventEmitter<void>()

  @ViewChild("messageTextarea", { static: false })
  messageTextarea?: ElementRef<HTMLTextAreaElement>
  @ViewChild("mentionDropdown") mentionDropdown?: ElementRef<HTMLElement>
  @ViewChild("channelDropdown") channelDropdown?: ElementRef<HTMLElement>
  @ViewChild("mentionButton") mentionButton?: ElementRef<HTMLElement>

  messageText = ""
  showEmojiPicker = false
  showMentionDropdown = false
  showChannelDropdown = false
  availableUsers: any[] = []
  availableChannels: any[] = []

  private messagesFacade = inject(MessagesFacadeService)
  private dmFacade = inject(DirectMessagesFacadeService)
  private usersFacade = inject(UsersFacadeService)
  private channelsFacade = inject(ChannelsFacadeService)
  private typingService = inject(TypingService)

  private typingTimeout?: any

  trackByUid(index: number, u: User) {
    return u.uid;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["editingMessage"] && this.editingMessage) {
      this.messageText = this.editingMessage.text || ""
    }
  }

  public focusAndClear(): void {
    if (this.messageTextarea) {
      this.messageTextarea.nativeElement.value = '';
      queueMicrotask(() => this.messageTextarea?.nativeElement.focus());
    }
  }

  ngAfterViewInit(): void {
    if (this.messageTextarea) this.messageTextarea.nativeElement.focus();
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement
    const clickedInsideDropdown =
      this.mentionDropdown?.nativeElement.contains(target) || this.channelDropdown?.nativeElement.contains(target)
    const clickedOnButton = this.mentionButton?.nativeElement.contains(target)

    if (!clickedInsideDropdown && !clickedOnButton) {
      this.showMentionDropdown = false
      this.showChannelDropdown = false
    }
  }

  @HostListener("document:keydown.escape")
  onEscape() {
    this.showMentionDropdown = false
    this.showChannelDropdown = false
    this.showEmojiPicker = false
  }

  onInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPos)
    const lastChar = textBeforeCursor[textBeforeCursor.length - 1]

    if (lastChar === "@") {
      this.openMentionDropdown()
    } else if (lastChar === "#") {
      this.openChannelDropdown()
    }

    this.handleTyping()
  }

  private async handleTyping() {
    const currentUserId = this.usersFacade.currentUserSig()?.id
    if (!currentUserId) return

    await this.typingService.setTyping(currentUserId)

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }

    this.typingTimeout = setTimeout(async () => {
      await this.typingService.removeTyping(currentUserId)
    }, 2000)
  }

  openMentionDropdown() {
    this.showChannelDropdown = false
    this.showMentionDropdown = true
    const users = this.usersFacade.users()
    this.availableUsers = users || []
  }

  openChannelDropdown() {
    this.showMentionDropdown = false
    this.showChannelDropdown = true
    this.availableChannels = this.channelsFacade.visibleChannelsSig() || []
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

  onMentionClick(event: MouseEvent) {
    event.stopPropagation()
    this.openMentionDropdown()
  }

  onUserSelected(user: any) {
    this.messageText = this.messageText.replace(/@$/, `@${user.displayName} `)
    this.showMentionDropdown = false
    this.messageTextarea?.nativeElement.focus()
  }

  onChannelSelected(channel: any) {
    this.messageText = this.messageText.replace(/#$/, `#${channel.name} `)
    this.showChannelDropdown = false
    this.messageTextarea?.nativeElement.focus()
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      this.onSendMessage()
    }
  }

  async onSendMessage() {
    if (!this.messageText.trim()) return

    const currentUserId = this.usersFacade.currentUserSig()?.id
    if (currentUserId) {
      await this.typingService.removeTyping(currentUserId)
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout)
      }
    }

    try {
      if (this.editingMessage) {
        await this.handleEdit()
      } else {
        await this.handleSend()
      }
      this.messageText = ""
    } catch (error) {
      console.error(error)
    }
  }

  private async handleEdit() {
    if (this.isDM && this.userId && this.editingMessage?.id) {
      if (!this.editingMessage.dmId) return
      await this.dmFacade.updateDMMessage(this.editingMessage.dmId, this.editingMessage.id, this.messageText)
    } else if (this.channelId && this.editingMessage?.id) {
      await this.messagesFacade.updateMessage(
        this.channelId,
        this.editingMessage.topicId,
        this.editingMessage.id,
        this.messageText,
      )
    }
    this.editComplete.emit()
  }

  cancelEdit() {
    this.messageText = ""
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
    await this.messagesFacade.sendMessage(this.channelId, activeTopicId, this.messageText, this.parentMessageId)
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