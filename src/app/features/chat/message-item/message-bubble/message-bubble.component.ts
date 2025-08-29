import { Component, Input, Output, EventEmitter } from "@angular/core"
import { NgClass, NgIf } from "@angular/common"

@Component({
  selector: "app-message-bubble",
  imports: [NgClass, NgIf],
  templateUrl: "./message-bubble.component.html",
  styleUrl: "./message-bubble.component.scss",
})
export class MessageBubbleComponent {
  @Input() message: any
  @Input() messageUser: any
  @Input() isOwnMessage = false
  @Output() replyClicked = new EventEmitter<any>()
  @Output() emojiPickerToggled = new EventEmitter<MouseEvent>()

  onReplyClick() {
    this.replyClicked.emit(this.message)
  }

  onEmojiPickerToggle(event: MouseEvent) {
    this.emojiPickerToggled.emit(event)
  }

  getTopEmoji(index: number): string {
    const stored = localStorage.getItem("emojiUsage")
    const emojiUsageCount = stored ? JSON.parse(stored) : {}

    const sortedEmojis = Object.entries(emojiUsageCount)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .map(([emoji]) => emoji)

    return sortedEmojis[index] || ""
  }

  addQuickReaction(emoji: string) {
    console.log("Quick reaction added:", emoji, "to message:", this.message.id)
  }
}
