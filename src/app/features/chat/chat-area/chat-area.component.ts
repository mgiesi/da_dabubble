// src/app/features/chat/chat-area/chat-area.component.ts
import { Component, Output, Input, inject, type OnInit, type OnChanges, EventEmitter } from "@angular/core"
import { MatCardModule } from "@angular/material/card"
import { NgFor } from "@angular/common"
import { MessageInputComponent } from "../message-input/message-input.component"
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import type { User } from "../../../shared/models/user"
import type { Channel } from "../../../shared/models/channel"
import { MockDataService } from "../../../core/services/mock-data.service"
import { MessageItemComponent } from "../message-item/message-item.component"

/**
 * Main chat area component that displays channel information, messages, and input field.
 * Shows the selected channel's header with member avatars, message area, and message input.
 *
 * @example
 * <app-chat-area [channelId]="selectedChannelId"></app-chat-area>
 */
@Component({
  selector: "app-chat-area",
  imports: [MatCardModule, NgFor, MessageInputComponent, MessageItemComponent],
  templateUrl: "./chat-area.component.html",
  styleUrl: "./chat-area.component.scss",
})
export class ChatAreaComponent implements OnInit, OnChanges {
  @Input() channelId: string | null = null
  @Output() threadOpened = new EventEmitter<any>()

  private channelsFacade = inject(ChannelsFacadeService)
  private usersFacade = inject(UsersFacadeService)
  private mockData = inject(MockDataService)

  /** The currently selected channel object */
  currentChannel: Channel | null = null

  /** Number of members in the current channel */
  memberCount = 0

  /** Array of users who are members of the current channel */
  members: User[] = []

  /** Flag to show/hide the detailed members list */
  showMembersList = false

  /** Mock message data for testing purposes - will be replaced with real messages */
  mockMessages: any[] = []

  /**
   * Initializes the component and loads channel data if channelId is provided.
   */
  async ngOnInit() {
    if (this.channelId) {
      this.loadChannelData()
      this.loadChannelMembers()
      this.loadMessages()
    }
  }

  /**
   * Handles changes to input properties, specifically when channelId changes.
   * Reloads channel data and members when a new channel is selected.
   */
  ngOnChanges() {
    if (this.channelId) {
      this.loadChannelData()
      this.loadChannelMembers()
      this.loadMessages()
    }
  }

  /**
   * Loads messages for the current channel.
   * Filters mock messages by channelId to prevent re-rendering issues.
   */
  private loadMessages() {
    if (this.channelId) {
      this.mockMessages = this.mockData.getMockMessages().filter((m) => m.channelId === this.channelId)
    } else {
      this.mockMessages = []
    }
  }

  /**
   * Loads the channel details from the database.
   * Subscribes to the channels observable and finds the matching channel by ID.
   */
  async loadChannelData() {
    const channels = this.channelsFacade.channels()
    this.currentChannel = channels.find((c) => c.id === this.channelId) || null
  }

  /**
   * Loads the members of the current channel.
   * Gets user IDs from channel members subcollection and fetches user details.
   */
  async loadChannelMembers() {
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

  /**
   * Gets the display name for the current chat.
   * Returns the channel name or a fallback if no channel is selected.
   */
  get currentChatName(): string {
    return this.currentChannel?.name || "Entwicklerteam"
  }

  /**
   * Handles thread opening when user replies to a message.
   * Emits the message to parent component for thread view.
   */
  onReplyToMessage(message: any) {
    console.log("Reply to:", message)
    this.threadOpened.emit(message)
  }
}