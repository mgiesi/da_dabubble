import {
  Component,
  EventEmitter,
  computed,
  inject,
  ChangeDetectorRef,
  type OnInit,
  type OnDestroy,
} from "@angular/core"
import { Input, Output } from "@angular/core"
import { NgClass, NgIf } from "@angular/common"
import type { Subscription } from "rxjs"
import { ProfileAvatarComponent } from "../../profile/profile-avatar/profile-avatar.component"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { MessageBubbleComponent } from "./message-bubble/message-bubble.component"
import { MessageEmojiPickerComponent } from "./message-emoji-picker/message-emoji-picker.component"
import { MessageReactionsComponent } from "./message-reactions/message-reactions.component"
import { MessageThreadLinkComponent } from "./message-thread-link/message-thread-link.component"
import { formatMessageTime } from "../../../shared/utils/timestamp"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import { DirectMessagesFacadeService } from "../../../core/facades/direct-messages-facade.service"
import { GlobalReactionService } from "../../../core/reactions/global-reaction.service"
import { Auth } from "@angular/fire/auth"

@Component({
  selector: "app-message-item",
  imports: [
    NgClass,
    NgIf,
    ProfileAvatarComponent,
    MessageBubbleComponent,
    MessageEmojiPickerComponent,
    MessageReactionsComponent,
    MessageThreadLinkComponent,
  ],
  templateUrl: "./message-item.component.html",
  styleUrl: "./message-item.component.scss",
})
export class MessageItemComponent implements OnInit, OnDestroy {
  @Input() isThreadView = false
  @Input() isDM = false
  @Input() message!: any
  @Output() editComplete = new EventEmitter<void>()
  @Output() replyClicked = new EventEmitter<any>()
  @Output() editClicked = new EventEmitter<any>()

  private usersFacade = inject(UsersFacadeService)
  private cdr = inject(ChangeDetectorRef)
  private messagesFacade = inject(MessagesFacadeService)
  private dmFacade = inject(DirectMessagesFacadeService)
  private globalReactions = inject(GlobalReactionService)
  private auth = inject(Auth)

  viewEmojiPicker = false
  selectedEmoji: string | null = null
  private sub?: Subscription
  private quickReactions: string[] = []

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

  get currentUserId(): string {
    return this.auth.currentUser?.uid || ""
  }

  ngOnInit() {
    if (this.globalReactions) {
      this.sub = this.globalReactions.topN$(2).subscribe((list) => (this.quickReactions = list))
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe()
  }

  getTopEmoji(i: number): string {
    return this.quickReactions[i] || ""
  }

  addQuickReaction(emoji: string): void {
    this.handleUserEmojiReaction(emoji)
  }

  onEmojiSelected(emoji: string) {
    this.viewEmojiPicker = false

    if (!this.message?.id) return

    this.handleUserEmojiReaction(emoji)
  }

  private handleUserEmojiReaction(newEmoji: string) {
    const uid = this.currentUserId
    if (!uid) return

    // Just persist to Firestore - the subscription will update the UI
    this.persistReaction(newEmoji)
  }

  private findUserCurrentEmoji(reactions: any, uid: string): string | null {
    for (const [emoji, data] of Object.entries(reactions)) {
      const entry = data as { users: string[] }
      if (entry.users?.includes(uid)) {
        return emoji
      }
    }
    return null
  }

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

  private async persistReaction(emoji: string) {
    try {
      if (this.isDM) {
        // For direct messages, use dmFacade
        if (!this.message.dmId || !this.message.id) {
          console.error("Missing dmId or message id for DM reaction")
          return
        }
        await this.dmFacade.addDMReaction(this.message.dmId, this.message.id, emoji)
      } else {
        // For channel messages, use messagesFacade
        await this.messagesFacade.addReaction(this.message.channelId, this.message.topicId, this.message.id!, emoji)
      }
    } catch (error) {
      console.error("Failed to persist reaction:", error)
    }
  }

  onReplyClick() {
    this.replyClicked.emit(this.message)
  }

  onEditClick() {
    this.editClicked.emit(this.message)
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

    // Just persist to Firestore - the subscription will update the UI
    this.persistReaction(emoji)
  }

  onThreadClicked(message: any) {
    this.replyClicked.emit(message)
  }

  formatTime(timestamp: Date | null | undefined): string {
    return formatMessageTime(timestamp)
  }
}
