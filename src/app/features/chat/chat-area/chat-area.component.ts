import { Component, Output, Input, inject, type OnInit, type OnChanges, EventEmitter, ChangeDetectorRef, OnDestroy } from "@angular/core"
import { MatCardModule } from "@angular/material/card"
import { NgFor, NgIf } from "@angular/common"
import { MessageInputComponent } from "../message-input/message-input.component"
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { MessagesFacadeService, type Message } from "../../../core/facades/messages-facade.service"
import type { User } from "../../../shared/models/user"
import type { Channel } from "../../../shared/models/channel"
import { MessageItemComponent } from "../message-item/message-item.component"
import { Router } from "@angular/router"
import { LogoStateService } from "../../../core/services/logo-state.service"

@Component({
  selector: "app-chat-area",
  imports: [MatCardModule, NgFor, NgIf, MessageInputComponent, MessageItemComponent],
  templateUrl: "./chat-area.component.html",
  styleUrl: "./chat-area.component.scss",
})
export class ChatAreaComponent implements OnInit, OnChanges, OnDestroy {
  @Input() channelId: string | null = null
  @Output() threadOpened = new EventEmitter<any>()

  private router = inject(Router)
  private logoState = inject(LogoStateService)
  private channelsFacade = inject(ChannelsFacadeService)
  private usersFacade = inject(UsersFacadeService)
  private messagesFacade = inject(MessagesFacadeService)
  private cdr = inject(ChangeDetectorRef)

  currentChannel: Channel | null = null
  memberCount = 0
  members: User[] = []
  showMembersList = false
  messages: Message[] = []
  isLoadingMessages = false
  private messageSubscription: (() => void) | null = null

  async ngOnInit() {
    if (this.channelId) {
      await this.initializeChannel()
      this.logoState.setCurrentView("chat")
    }
  }

  async ngOnChanges() {
    this.cleanupSubscription()
    if (this.channelId) {
      await this.initializeChannel()
    }
  }

  ngOnDestroy() {
    this.cleanupSubscription()
  }

  /**
   * Initialize channel data and subscriptions
   */
  private async initializeChannel() {
    if (!this.channelId) return

    this.isLoadingMessages = true
    await Promise.all([
      this.loadChannelData(),
      this.loadChannelMembers(),
      this.setupMessageSubscription()
    ])
    this.isLoadingMessages = false
  }

  /**
   * Setup real-time message subscription
   */
  private async setupMessageSubscription() {
    if (!this.channelId) return

    console.log(`[v2] Setting up subscription for channel: ${this.channelId}`)

    this.messageSubscription = this.messagesFacade.subscribeToChannelMessages(
      this.channelId,
      (messages) => {
        console.log(`[v2] Callback received ${messages.length} messages:`, messages)
        this.messages = messages
        this.cdr.detectChanges() // Das hat gefehlt!
      }
    )
  }

  /**
   * Clean up message subscription
   */
  private cleanupSubscription() {
    if (this.messageSubscription) {
      console.log("Cleaning up message subscription")
      this.messageSubscription()
      this.messageSubscription = null
    }
  }

  /**
   * Load channel data
   */
  private async loadChannelData() {
    const channels = this.channelsFacade.channels()
    this.currentChannel = channels.find((c) => c.id === this.channelId) || null
  }

  /**
   * Load channel members
   */
  private async loadChannelMembers() {
    if (!this.channelId) return

    try {
      const userIds = await this.channelsFacade.getChannelMembers(this.channelId)
      this.memberCount = userIds.length

      const allUsers = this.usersFacade.users()
      if (allUsers) {
        this.members = allUsers.filter((user) => userIds.includes(user.id || ""))
      }
    } catch (error) {
      console.error("Failed to load channel members:", error)
      this.memberCount = 3
      this.members = this.usersFacade.users()?.slice(0, 3) || []
    }
  }

  get currentChatName(): string {
    return this.currentChannel?.name || "Entwicklerteam"
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id || index.toString()
  }

  onReplyToMessage(message: Message) {
    console.log("Reply to:", message)
    this.threadOpened.emit(message)
  }

  openThread(threadId: string) {
    this.logoState.setCurrentView("thread")
    if (this.logoState.showBackArrow()) {
      this.router.navigate(["/m/thread", threadId])
    }
  }
}