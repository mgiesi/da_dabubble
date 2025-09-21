import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from "@angular/core"
import { NgIf } from "@angular/common"

@Component({
  selector: "app-message-bubble",
  standalone: true,
  imports: [NgIf],
  templateUrl: "./message-bubble.component.html",
  styleUrls: ["./message-bubble.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBubbleComponent {
  @Input() message: any
  @Input() messageUser: any
  @Input() isOwnMessage = false
  @Output() replyClicked = new EventEmitter<any>()
  @Output() emojiPickerToggled = new EventEmitter<MouseEvent>()

  onReplyClick(): void { 
    this.replyClicked.emit(this.message) 
  }

  onEmojiPickerToggle(event: MouseEvent): void { 
    this.emojiPickerToggled.emit(event) 
  }
}