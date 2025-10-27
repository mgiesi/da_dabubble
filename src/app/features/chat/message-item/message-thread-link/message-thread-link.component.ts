import { Component, Input, Output, EventEmitter, inject, OnInit } from "@angular/core"
import { NgIf } from "@angular/common"
import { MessagesFacadeService } from "../../../../core/facades/messages-facade.service"
import { formatMessageTime } from "../../../../shared/utils/timestamp"

@Component({
  selector: "app-message-thread-link",
  imports: [NgIf],
  templateUrl: "./message-thread-link.component.html",
  styleUrl: "./message-thread-link.component.scss",
})
export class MessageThreadLinkComponent implements OnInit {
  @Input() message: any
  @Input() isThreadView = false
  @Output() threadClicked = new EventEmitter<any>()

  private messagesFacade = inject(MessagesFacadeService)
  
  lastReplyTimestamp: Date | null = null

  ngOnInit() {
    if (this.hasThreadReplies()) {
      this.loadLastReplyTimestamp()
    }
  }

  hasThreadReplies(): boolean {
    return !!this.message?.threadCount && this.message.threadCount > 0
  }

  getThreadRepliesText(): string {
    const count = this.message?.threadCount || 0
    return count === 1 ? "1 Antwort" : `${count} Antworten`
  }

  formatLastReplyTime(): string {
    return formatMessageTime(this.lastReplyTimestamp)
  }

  private loadLastReplyTimestamp() {
    if (!this.message?.channelId || !this.message?.id) return

    this.messagesFacade.subscribeToThreadMessages(
      this.message.channelId,
      this.message.id,
      (messages) => {
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1]
          this.lastReplyTimestamp = lastMessage.timestamp
        }
      }
    )
  }

  onThreadClick() {
    this.threadClicked.emit(this.message)
  }
}