import { Component, Input, Output, EventEmitter } from "@angular/core"
import { NgFor, NgIf } from "@angular/common"

@Component({
  selector: "app-message-reactions",
  imports: [NgFor, NgIf ],
  templateUrl: "./message-reactions.component.html",
  styleUrl: "./message-reactions.component.scss",
})
export class MessageReactionsComponent {
  @Input() reactions: { [emoji: string]: { count: number; users: string[] } } = {}
  @Input() isOwnMessage = false // Add isOwnMessage input for positioning
  @Output() reactionClicked = new EventEmitter<{ emoji: string; data: any }>()

  onReactionClick(emoji: string, reactionData: any) {
    this.reactionClicked.emit({ emoji, data: reactionData })
  }

  trackByReaction(index: number, item: any): string {
    return item.key // emoji is the key
  }

  hasReactions(): boolean {
    return this.reactions && Object.keys(this.reactions).length > 0
  }
}
