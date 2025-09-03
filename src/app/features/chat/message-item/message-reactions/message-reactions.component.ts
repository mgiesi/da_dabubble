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
  @Input() currentUserId!: string;

  isActive(val: { count: number; users: string[] }): boolean {
    return Array.isArray(val?.users) && val.users.includes(this.currentUserId);
  }

  // Optional: Slack-ähnliche Sortierung (Count ⬇︎, dann Emoji)
  sortByCountDesc = (a: any, b: any) => {
    const ac = a.value?.count ?? 0, bc = b.value?.count ?? 0;
    if (bc !== ac) return bc - ac;
    return a.key.localeCompare(b.key);
  };

  originalOrder = () => 0;

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
    Object.keys(this.reactions).forEach(key => {
    })
  }
}