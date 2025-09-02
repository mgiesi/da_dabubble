import { Component, Input, Output, EventEmitter } from "@angular/core"
import { NgFor, NgIf, KeyValuePipe } from "@angular/common"

@Component({
  selector: "app-message-reactions",
  imports: [NgFor, NgIf, KeyValuePipe],
  templateUrl: "./message-reactions.component.html",
  styleUrl: "./message-reactions.component.scss",
})
export class MessageReactionsComponent {
  @Input() reactions: { [emoji: string]: { count: number; users: string[] } } = {}
  @Input() isOwnMessage = false
  @Output() reactionClicked = new EventEmitter<{ emoji: string; data: any }>()

  onReactionClick(emoji: string, reactionData: any) {
    this.reactionClicked.emit({ emoji, data: reactionData })
  }

  trackByReaction(index: number, item: any): string {
    return item.key
  }

  hasReactions(): boolean {
    return Object.keys(this.reactions).length > 0
  }

  ngOnInit(): void {
    console.log('Full reactions object:', this.reactions)
    Object.keys(this.reactions).forEach(key => {
      console.log('Emoji key:', key, 'Unicode:', key.charCodeAt(0))
    })
  }
}