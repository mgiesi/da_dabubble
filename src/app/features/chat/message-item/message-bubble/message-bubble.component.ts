import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy } from "@angular/core"
import { NgIf } from "@angular/common"

@Component({
  selector: "app-message-bubble",
  imports: [NgIf],
  templateUrl: "./message-bubble.component.html",
  styleUrl: "./message-bubble.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush // WICHTIG: Stops re-rendering loops
})
export class MessageBubbleComponent implements OnInit {
  @Input() message: any
  @Input() messageUser: any
  @Input() isOwnMessage = false
  @Output() replyClicked = new EventEmitter<any>()
  @Output() emojiPickerToggled = new EventEmitter<MouseEvent>()
  @Output() quickReactionClicked = new EventEmitter<string>()

  // Cache the emojis to prevent recalculation
  private cachedEmojis: string[] = ["👍", "❤️"]

  ngOnInit() {
    console.log("🐛 SVG: Component initialized ONCE")
    this.updateCachedEmojis()
  }

  onReplyClick() {
    console.log("🐛 SVG: Reply clicked")
    this.replyClicked.emit(this.message)
  }

  onEmojiPickerToggle(event: MouseEvent) {
    console.log("🐛 SVG: Emoji picker clicked") 
    this.emojiPickerToggled.emit(event)
  }

  getTopEmoji(index: number): string {
    // Return cached value to prevent recalculation on every change detection
    return this.cachedEmojis[index] || ""
  }

  addQuickReaction(emoji: string) {
    console.log("🐛 SVG: Quick reaction clicked")
    this.quickReactionClicked.emit(emoji)
  }

  private updateCachedEmojis() {
    const reactions = this.message?.reactions || {}
    const hasReactions = Object.keys(reactions).length > 0
    
    if (hasReactions) {
      const sortedEmojis = Object.entries(reactions)
        .sort((a, b) => (b[1] as any).count - (a[1] as any).count)
        .map(([emoji]) => emoji)
      
      this.cachedEmojis = [
        sortedEmojis[0] || "👍",
        sortedEmojis[1] || "❤️"
      ]
    } else {
      this.cachedEmojis = ["👍", "❤️"]
    }
  }
}