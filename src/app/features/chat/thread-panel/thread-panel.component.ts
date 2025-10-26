import { Component, Input, Output, EventEmitter, type OnInit, type OnDestroy, type OnChanges, type SimpleChanges, ChangeDetectorRef } from "@angular/core"
import { inject } from "@angular/core"
import { NgFor } from "@angular/common"
import { MessageItemComponent } from "../message-item/message-item.component"
import { MessageInputComponent } from "../message-input/message-input.component"
import { LogoStateService } from "../../../core/services/logo-state.service"
import { MessagesFacadeService } from "../../../core/facades/messages-facade.service"
import type { ChannelMessage } from "../../../shared/models/channel-message"

@Component({
  selector: "app-thread-panel",
  imports: [NgFor, MessageItemComponent, MessageInputComponent],
  templateUrl: "./thread-panel.component.html",
  styleUrl: "./thread-panel.component.scss",
})
export class ThreadPanelComponent implements OnInit, OnDestroy, OnChanges {
  @Input() message: any = null
  @Input() currentChannelName = ""
  @Input() selectedChannelId: string | null = null
  @Output() backToChat = new EventEmitter<void>()

  private logoState = inject(LogoStateService)
  private messagesFacade = inject(MessagesFacadeService)
  private cdr = inject(ChangeDetectorRef)

  threadMessages: ChannelMessage[] = []
  editingMessage: any = null
  private threadSubscription: (() => void) | null = null
  private parentMessageSubscription: (() => void) | null = null

  ngOnInit() {
    this.logoState.setCurrentView("thread")
    this.initializeThread()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message'] || changes['selectedChannelId']) {
      this.reloadThread()
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

  private setupParentMessageSubscription() {
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
}