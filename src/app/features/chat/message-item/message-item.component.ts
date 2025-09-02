import { Component, EventEmitter, computed, inject, ChangeDetectorRef, type OnInit } from "@angular/core"
import { Input, Output } from "@angular/core"
import { NgClass } from "@angular/common"
import { ProfileAvatarComponent } from "../../profile/profile-avatar/profile-avatar.component"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { MessageBubbleComponent } from "./message-bubble/message-bubble.component"
import { MessageEmojiPickerComponent } from "./message-emoji-picker/message-emoji-picker.component"
import { MessageReactionsComponent } from "./message-reactions/message-reactions.component"
import { MessageThreadLinkComponent } from "./message-thread-link/message-thread-link.component"
import { formatMessageTime } from "../../../shared/utils/timestamp"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
@Component({
  selector: "app-message-item",
  imports: [
    NgClass,
    ProfileAvatarComponent,
    MessageBubbleComponent,
    MessageEmojiPickerComponent,
    MessageReactionsComponent,
    MessageThreadLinkComponent,
  ],
  templateUrl: "./message-item.component.html",
  styleUrl: "./message-item.component.scss",
})
export class MessageItemComponent implements OnInit {
  @Input() isThreadView = false
  @Input() message!: any
  @Output() replyClicked = new EventEmitter<any>()

  private usersFacade = inject(UsersFacadeService)
  private cdr = inject(ChangeDetectorRef)
  private messagesFacade = inject(MessagesFacadeService)

  viewEmojiPicker = false
  selectedEmoji: string | null = null

  messageUser = computed(() => {
    if (!this.message?.senderId) {
      console.log("No senderId in message:", this.message)
      return null
    }

    const allUsers = this.usersFacade.users()
    if (!allUsers || allUsers.length === 0) {
      console.log("No users available")
      return null
    }

    const user =
      allUsers.find((user) => user.id === this.message.senderId || user.uid === this.message.senderId) || null

    console.log("Found user for senderId", this.message.senderId, ":", user)
    return user
  })

  ngOnInit() {
    console.log("Message item initialized with:", this.message)
  }


  onReplyClick() {
    this.replyClicked.emit(this.message)
  }

  onEmojiPickerToggle(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    console.log("Toggle emoji picker, current state:", this.viewEmojiPicker)
    this.viewEmojiPicker = !this.viewEmojiPicker
    console.log("New state:", this.viewEmojiPicker)
    this.cdr.detectChanges()
  }

  onEmojiSelected(emoji: string) {
    this.selectedEmoji = emoji
    console.log("Emoji selected:", emoji)
    this.viewEmojiPicker = false

    // Add reaction to message
    if (this.message?.id && this.message?.channelId && this.message?.topicId) {
      this.addReactionToMessage(emoji)
    }
  }

  private async addReactionToMessage(emoji: string) {
    try {
      await this.messagesFacade.addReaction(
        this.message.channelId,
        this.message.topicId,
        this.message.id!,
        emoji
      )
    } catch (error) {
      console.error("Failed to add reaction:", error)
    }
  }

  onEmojiPickerClosed() {
    this.viewEmojiPicker = false
  }

  onReactionClicked(reaction: any) {
    console.log("Reaction clicked:", reaction)
  }

  onThreadClicked(message: any) {
    this.replyClicked.emit(message)
  }

  /**
   * Format message timestamp for display
   */
  formatTime(timestamp: Date | null | undefined): string {
    return formatMessageTime(timestamp)
  }
}
