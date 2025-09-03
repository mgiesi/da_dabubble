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
  @Input() currentUserId: string = ''
  @Output() reactionClicked = new EventEmitter<{ emoji: string; data: any }>()

  /**
   * Checks if current user has reacted with this emoji
   */
  isActive(reactionData: { count: number; users: string[] }): boolean {
    if (!this.currentUserId || !reactionData?.users) return false
    return reactionData.users.includes(this.currentUserId)
  }

  /**
   * Sorts reactions by count (descending) then emoji name
   */
  sortByCountDesc = (a: any, b: any) => {
    const countA = a.value?.count ?? 0
    const countB = b.value?.count ?? 0
    
    if (countB !== countA) {
      return countB - countA
    }
    
    return a.key.localeCompare(b.key)
  }

  /**
   * Handles click on reaction button
   */
  onReactionClick(emoji: string, reactionData: any) {
    if (!emoji) return
    this.reactionClicked.emit({ emoji, data: reactionData })
  }

  /**
   * TrackBy function for ngFor performance
   */
  trackByReaction(index: number, item: any): string {
    return item.key
  }

  /**
   * Checks if message has any reactions
   */
  hasReactions(): boolean {
    return Object.keys(this.reactions || {}).length > 0
  }
}