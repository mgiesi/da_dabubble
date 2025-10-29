import { Component, Input, Output, EventEmitter, type OnInit, type OnDestroy, type OnChanges, type SimpleChanges, ChangeDetectorRef } from "@angular/core"
import { inject } from "@angular/core"
import { NgFor, NgIf } from "@angular/common"
import { MessageItemComponent } from "../message-item/message-item.component"
import { MessageInputComponent } from "../message-input/message-input.component"
import { LogoStateService } from "../../../core/services/logo-state.service"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import { DirectMessagesFacadeService } from "../../../core/facades/direct-messages-facade.service"
import type { ChannelMessage } from "../../../shared/models/channel-message"

@Component({
  selector: "app-thread-panel",
  imports: [NgFor, NgIf, MessageItemComponent, MessageInputComponent],
  templateUrl: "./thread-panel.component.html",
  styleUrl: "./thread-panel.component.scss",
})
export class ThreadPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() message: any = null
  @Input() currentChannelName = ""
  @Input() selectedChannelId: string | null = null
  @Input() highlightMessageId?: string | null
  @Input() isDM = false
  @Input() selectedUserId: string | null = null
  @Output() backToChat = new EventEmitter<void>()

  private logoState = inject(LogoStateService)
  private messagesFacade = inject(MessagesFacadeService)
  private dmFacade = inject(DirectMessagesFacadeService)
  private cdr = inject(ChangeDetectorRef)

  threadMessages: ChannelMessage[] = []
  editingMessage: any = null
  private threadSubscription: (() => void) | null = null
  private parentMessageSubscription: (() => void) | null = null

  highlightedMessageId: string | null = null

  ngOnInit() {
    this.logoState.setCurrentView("thread")
    this.initializeThread()
    this.applyHighlight()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message'] || changes['selectedChannelId'] || changes['selectedUserId']) {
      this.reloadThread()
    }
    if (changes['highlightMessageId']) {
      this.applyHighlight()
    }
  }

  ngOnDestroy() {
    this.cleanupSubscription()
  }

  private initializeThread() {
    this.setupThreadSubscription()
    this.setupParentMessageSubscription()
  }

  private reloadThread() {
    this.cleanupSubscription()
    this.threadMessages = []
    this.initializeThread()
  }

  private setupThreadSubscription() {
    if (this.isDM) {
      // DM Thread - EXACTLY like Channel threads!
      if (!this.selectedUserId || !this.message?.id) return

      this.threadSubscription = this.dmFacade.subscribeToDMThreadMessages(
        this.selectedUserId,  // ✅ targetUserId (not dmId!)
        this.message.id,      // ✅ parentMessageId
        (messages) => {
          this.threadMessages = messages as any
          this.cdr.detectChanges()
        },
      )
    } else {
      // Channel Thread
      if (!this.selectedChannelId || !this.message?.id) return

      this.threadSubscription = this.messagesFacade.subscribeToThreadMessages(
        this.selectedChannelId,
        this.message.id,
        (messages) => {
          this.threadMessages = messages
          this.cdr.detectChanges()
        },
      )
    }
  }

  private setupParentMessageSubscription() {
    if (this.isDM) {
      // DM Parent Message - EXACTLY like Channel threads!
      if (!this.selectedUserId || !this.message?.id) return

      this.parentMessageSubscription = this.dmFacade.subscribeToDMParentMessage(
        this.selectedUserId,  // ✅ targetUserId (not dmId!)
        this.message.id,      // ✅ messageId
        (updatedMessage) => {
          if (updatedMessage) {
            this.message = updatedMessage
            this.cdr.detectChanges()
          }
        },
      )
    } else {
      // Channel Parent Message
      if (!this.selectedChannelId || !this.message?.id || !this.message?.topicId) return

      this.parentMessageSubscription = this.messagesFacade.subscribeToParentMessage(
        this.selectedChannelId,
        this.message.topicId,
        this.message.id,
        (updatedMessage) => {
          if (updatedMessage) {
            this.message = updatedMessage
            this.cdr.detectChanges()
          }
        },
      )
    }
  }
  
  private cleanupSubscription() {
    if (this.threadSubscription) {
      this.threadSubscription()
      this.threadSubscription = null
    }
    if (this.parentMessageSubscription) {
      this.parentMessageSubscription()
      this.parentMessageSubscription = null
    }
  }

  onBackToChat() {
    this.backToChat.emit()
  }

  onEditMessage(message: any) {
    this.editingMessage = message
  }

  onEditComplete() {
    this.editingMessage = null
  }

  async onDeleteMessage(message: any) {
    if (!confirm('Möchtest du diese Nachricht wirklich löschen?')) return;

    try {
      if (this.isDM && message.dmId && message.id) {
        await this.dmFacade.deleteDMMessage(message.dmId, message.id);
      } else if (this.selectedChannelId && message.id) {
        await this.messagesFacade.deleteMessage(this.selectedChannelId, message.topicId, message.id);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  private applyHighlight() {
     if (this.highlightMessageId) {
      this.highlightedMessageId = this.highlightMessageId
      setTimeout(() => {
               this.highlightedMessageId = null
      }, 2000)
    }
  }
}