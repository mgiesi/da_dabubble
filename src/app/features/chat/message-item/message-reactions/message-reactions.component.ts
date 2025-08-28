import { Component, Input, Output, EventEmitter } from "@angular/core"
import { NgFor, NgIf } from "@angular/common"

@Component({
  selector: "app-message-reactions",
  imports: [NgFor, NgIf],
  templateUrl: "./message-reactions.component.html",
  styleUrl: "./message-reactions.component.scss",
})
export class MessageReactionsComponent {
  @Input() reactions: any[] = []
  @Output() reactionClicked = new EventEmitter<any>()

  onReactionClick(reaction: any) {
    this.reactionClicked.emit(reaction)
  }

  trackByReaction(index: number, reaction: any): string {
    return `${reaction.emoji}-${reaction.count}`
  }
}
