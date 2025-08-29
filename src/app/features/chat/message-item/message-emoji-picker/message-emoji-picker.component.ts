import { Component, Input, Output, EventEmitter, HostListener, inject, ChangeDetectorRef } from "@angular/core"
import { NgIf } from "@angular/common"
import { PickerComponent } from "@ctrl/ngx-emoji-mart"

@Component({
  selector: "app-message-emoji-picker",
  imports: [NgIf, PickerComponent],
  templateUrl: "./message-emoji-picker.component.html",
  styleUrl: "./message-emoji-picker.component.scss",
})
export class MessageEmojiPickerComponent {
  @Input() isVisible = false
  @Input() selectedEmoji: string | null = null
  @Output() emojiSelected = new EventEmitter<string>()
  @Output() pickerClosed = new EventEmitter<void>()

  private cdr = inject(ChangeDetectorRef)
  private emojiUsageCount: { [emoji: string]: number } = {}

  ngOnInit() {
    this.loadEmojiUsage()
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native

    this.emojiUsageCount[emoji] = (this.emojiUsageCount[emoji] || 0) + 1
    this.saveEmojiUsage()

    this.emojiSelected.emit(emoji)
    this.closePicker()
  }

  closePicker() {
    this.pickerClosed.emit()
  }

  @HostListener("document:click", ["$event"])
  closeOnOutsideClick(event: Event) {
    if (!this.isVisible) return

    const target = event.target as HTMLElement

    // Don't close if clicking inside emoji picker or on emoji button
    if (
      target.closest("emoji-mart") ||
      target.closest(".hover-action-btn") ||
      target.classList.contains("hover-action-btn")
    ) {
      return
    }

    console.log("Closing emoji picker - clicked outside")
    this.closePicker()
  }

  private saveEmojiUsage() {
    localStorage.setItem("emojiUsage", JSON.stringify(this.emojiUsageCount))
  }

  private loadEmojiUsage() {
    const stored = localStorage.getItem("emojiUsage")
    this.emojiUsageCount = stored ? JSON.parse(stored) : {}
  }
}
