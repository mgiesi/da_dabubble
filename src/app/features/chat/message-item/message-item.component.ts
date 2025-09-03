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
import { Auth } from "@angular/fire/auth"

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
  private auth = inject(Auth)

  viewEmojiPicker = false
  selectedEmoji: string | null = null

  messageUser = computed(() => {
    if (!this.message?.senderId) {
      return null
    }

    const allUsers = this.usersFacade.users()
    if (!allUsers || allUsers.length === 0) {
      return null
    }

    const user =
      allUsers.find((user) => user.id === this.message.senderId || user.uid === this.message.senderId) || null
    return user
  })

  /**
   * Gets current user ID from Firebase Auth
   */
  get currentUserId(): string {
    return this.auth.currentUser?.uid || ''
  }

  ngOnInit() {
    // Component initialization
  }

  /**
   * Handles emoji selection with single-emoji-per-user logic
   */
  onEmojiSelected(emoji: string) {
    this.viewEmojiPicker = false
    
    if (!this.message?.id) return
    
    this.handleUserEmojiReaction(emoji)
  }

  /**
   * Smart emoji reaction handler - one emoji per user
   */
  private handleUserEmojiReaction(newEmoji: string) {
    const uid = this.currentUserId
    if (!uid) return

    // Create reactions object if it doesn't exist
    const reactions = { ...(this.message.reactions || {}) }
    
    // Find user's current emoji (if any)
    const userCurrentEmoji = this.findUserCurrentEmoji(reactions, uid)
    
    if (userCurrentEmoji) {
      this.removeUserFromEmoji(reactions, userCurrentEmoji, uid)
    }
    
    // Add user to new emoji
    this.addUserToEmoji(reactions, newEmoji, uid)
    
    // Update UI optimistically
    this.message = { ...this.message, reactions }
    
    // Persist to backend
    this.persistReaction(newEmoji)
  }

  /**
   * Finds which emoji the user currently has
   */
  private findUserCurrentEmoji(reactions: any, uid: string): string | null {
    for (const [emoji, data] of Object.entries(reactions)) {
      const entry = data as { users: string[] }
      if (entry.users?.includes(uid)) {
        return emoji
      }
    }
    return null
  }

  /**
   * Removes user from emoji entry
   */
  private removeUserFromEmoji(reactions: any, emoji: string, uid: string) {
    const entry = reactions[emoji]
    if (!entry) return
    
    const userIndex = entry.users.indexOf(uid)
    if (userIndex > -1) {
      entry.users.splice(userIndex, 1)
      entry.count = Math.max(0, entry.count - 1)
      
      if (entry.count === 0) {
        delete reactions[emoji]
      }
    }
  }

  /**
   * Adds user to emoji entry
   */
  private addUserToEmoji(reactions: any, emoji: string, uid: string) {
    if (!reactions[emoji]) {
      reactions[emoji] = { count: 0, users: [] }
    }
    
    const entry = reactions[emoji]
    if (!entry.users.includes(uid)) {
      entry.users.push(uid)
      entry.count += 1
    }
  }

  /**
   * Persists reaction to backend
   */
  private async persistReaction(emoji: string) {
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

  onReplyClick() {
    this.replyClicked.emit(this.message)
  }

  onEmojiPickerToggle(event: MouseEvent) {
    event.stopPropagation()
    event.preventDefault()
    this.viewEmojiPicker = !this.viewEmojiPicker
    this.cdr.detectChanges()
  }

  onEmojiPickerClosed() {
    this.viewEmojiPicker = false
  }

  onReactionClicked(e: { emoji: string; data: any }) {
    if (!this.message?.id) return
    
    const emoji = e.emoji
    const uid = this.currentUserId
    if (!uid) return

    const reactions = { ...(this.message.reactions || {}) }
    const entry = reactions[emoji] ?? { count: 0, users: [] as string[] }

    const isUserReaction = entry.users.includes(uid)
    
    if (isUserReaction) {
      // Remove user's reaction
      this.removeUserFromEmoji(reactions, emoji, uid)
    } else {
      // First remove user from any other emoji
      const currentEmoji = this.findUserCurrentEmoji(reactions, uid)
      if (currentEmoji) {
        this.removeUserFromEmoji(reactions, currentEmoji, uid)
      }
      
      // Add user to clicked emoji
      this.addUserToEmoji(reactions, emoji, uid)
    }

    this.message = { ...this.message, reactions }
    this.persistReaction(emoji)
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