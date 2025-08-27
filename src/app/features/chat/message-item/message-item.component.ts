import { Component, EventEmitter, computed, inject, ChangeDetectorRef, HostListener, type OnInit } from "@angular/core"
import { Input, Output } from "@angular/core"
import { NgClass, NgIf, NgFor } from "@angular/common"
import { ProfileAvatarComponent } from "../../profile/profile-avatar/profile-avatar.component"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { PickerComponent } from "@ctrl/ngx-emoji-mart"
import { formatMessageTime } from "../../../shared/utils/timestamp"

@Component({
  selector: "app-message-item",
  imports: [NgClass, NgIf, NgFor, ProfileAvatarComponent, PickerComponent],
  templateUrl: "./message-item.component.html",
  styleUrl: "./message-item.component.scss",
})
export class MessageItemComponent implements OnInit {
  @Input() isThreadView = false
  @Input() message!: any
  @Output() replyClicked = new EventEmitter<any>()

  private usersFacade = inject(UsersFacadeService)
  private emojiUsageCount: { [emoji: string]: number } = {}
  private cdr = inject(ChangeDetectorRef)

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

    const user = allUsers.find((user) =>
      user.id === this.message.senderId || user.uid === this.message.senderId
    ) || null

    console.log("Found user for senderId", this.message.senderId, ":", user)
    return user
  })

  ngOnInit() {
    this.loadEmojiUsage()
    console.log("Message item initialized with:", this.message)
  }

  onReplyClick() {
    this.replyClicked.emit(this.message)
  }

  hasThreadReplies(): boolean {
    return !!this.message?.threadCount && this.message.threadCount > 0
  }

  getThreadRepliesText(): string {
    const count = this.message?.threadCount || 0
    return count === 1 ? "1 Antwort" : `${count} Antworten`
  }

  addReaction(emoji: string) {
    console.log("Reaction added:", emoji, "to message:", this.message.id)
  }

  showEmojiPicker(event: MouseEvent) {
    event.stopPropagation()
    this.viewEmojiPicker = !this.viewEmojiPicker
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native
    this.selectedEmoji = emoji

    this.emojiUsageCount[emoji] = (this.emojiUsageCount[emoji] || 0) + 1
    this.saveEmojiUsage()
    console.log("Emoji selected:", emoji)
  }

  private saveEmojiUsage() {
    localStorage.setItem("emojiUsage", JSON.stringify(this.emojiUsageCount))
  }

  private loadEmojiUsage() {
    const stored = localStorage.getItem("emojiUsage")
    this.emojiUsageCount = stored ? JSON.parse(stored) : {}
  }

  getTopEmoji(index: number): string {
    const sortedEmojis = Object.entries(this.emojiUsageCount)
      .sort((a, b) => b[1] - a[1])
      .map(([emoji]) => emoji)

    return sortedEmojis[index] || ""
  }

  @HostListener("document:click", ["$event"])
  closeEmojiPicker(event: Event) {
    this.viewEmojiPicker = false
  }

  trackByReaction(index: number, reaction: any): string {
    return `${reaction.emoji}-${reaction.count}`
  }

  /**
 * Format message timestamp for display
 */
  formatTime(timestamp: Date | null | undefined): string {
    return formatMessageTime(timestamp)
  }
}