import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, Optional } from "@angular/core"
import { NgIf } from "@angular/common"
import { Subscription } from "rxjs"
import { GlobalReactionService } from "../../../../core/reactions/global-reaction.service"

@Component({
  selector: "app-message-bubble",
  standalone: true,
  imports: [NgIf],
  templateUrl: "./message-bubble.component.html",
  styleUrls: ["./message-bubble.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent implements OnInit, OnDestroy {
  @Input() message: any
  @Input() messageUser: any
  @Input() isOwnMessage = false
  @Output() replyClicked = new EventEmitter<any>()
  @Output() emojiPickerToggled = new EventEmitter<MouseEvent>()
  @Output() quickReactionClicked = new EventEmitter<string>()

  private sub?: Subscription
  private quickReactions: string[] = []

  constructor(@Optional() private globalReactions: GlobalReactionService) {}

  ngOnInit(): void {
    if (this.globalReactions) {
      this.sub = this.globalReactions.topN$(2).subscribe(list => this.quickReactions = list)
    }
  }

  ngOnDestroy(): void { this.sub?.unsubscribe() }

  onReplyClick(): void { this.replyClicked.emit(this.message) }

  onEmojiPickerToggle(event: MouseEvent): void { this.emojiPickerToggled.emit(event) }

  getTopEmoji(i: number): string { return this.quickReactions[i] || "" }

  addQuickReaction(emoji: string): void { this.quickReactionClicked.emit(emoji) }
}
