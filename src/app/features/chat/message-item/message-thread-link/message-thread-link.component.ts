import { Component, Input, Output, EventEmitter } from "@angular/core"
import { NgIf } from "@angular/common"

@Component({
  selector: "app-message-thread-link",
  imports: [NgIf],
  templateUrl: "./message-thread-link.component.html",
  styleUrl: "./message-thread-link.component.scss",
})
export class MessageThreadLinkComponent {
  @Input() message: any
  @Input() isThreadView = false
  @Output() threadClicked = new EventEmitter<any>()

  hasThreadReplies(): boolean {
    return !!this.message?.threadCount && this.message.threadCount > 0
  }

  getThreadRepliesText(): string {
    const count = this.message?.threadCount || 0
    return count === 1 ? "1 Antwort" : `${count} Antworten`
  }

  onThreadClick() {
    this.threadClicked.emit(this.message)
  }
}
