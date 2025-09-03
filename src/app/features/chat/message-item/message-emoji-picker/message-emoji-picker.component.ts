import { Component, Input, Output, EventEmitter, HostListener, inject, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy } from "@angular/core"
import { NgIf } from "@angular/common"
import { createPicker } from 'picmo'

@Component({
  selector: "app-message-emoji-picker",
  imports: [NgIf],
  templateUrl: "./message-emoji-picker.component.html",
  styleUrl: "./message-emoji-picker.component.scss",
})
export class MessageEmojiPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() isVisible = false
  @Input() selectedEmoji: string | null = null
  @Output() emojiSelected = new EventEmitter<string>()
  @Output() pickerClosed = new EventEmitter<void>()

  @ViewChild('pickerContainer', { static: false }) pickerContainer!: ElementRef

  private cdr = inject(ChangeDetectorRef)
  private picker: any = null
  private emojiUsageCount: { [emoji: string]: number } = {}

  ngAfterViewInit() {
    if (this.isVisible) {
      this.initializePicker()
    }
  }

  ngOnChanges() {
    if (this.isVisible && !this.picker) {
      setTimeout(() => this.initializePicker(), 0)
    } else if (!this.isVisible && this.picker) {
      this.destroyPicker()
    }
  }

  ngOnDestroy() {
    this.destroyPicker()
  }

  /**
   * Initializes the Picmo emoji picker
   */
  private initializePicker() {
    if (!this.pickerContainer?.nativeElement || this.picker) return

    this.loadEmojiUsage()
    
    this.picker = createPicker({
      rootElement: this.pickerContainer.nativeElement,
      theme: 'light',
      showCategoryTabs: true,
      showSearch: true,
      showRecents: true,
      showPreview: false,
      emojisPerRow: 8,
      emojiSize: '1.8em',
      showVariants: true
    })

    this.picker.addEventListener('emoji:select', (event: any) => {
      this.onEmojiSelect(event.emoji)
    })
  }

  /**
   * Destroys the picker instance
   */
  private destroyPicker() {
    if (this.picker) {
      this.picker.destroy()
      this.picker = null
    }
  }

  /**
   * Handles emoji selection
   */
  private onEmojiSelect(emoji: string) {
    this.emojiUsageCount[emoji] = (this.emojiUsageCount[emoji] || 0) + 1
    this.saveEmojiUsage()

    this.emojiSelected.emit(emoji)
    this.closePicker()
  }

  /**
   * Handles backdrop click to close picker
   */
  onBackdropClick(event: Event) {
    event.stopPropagation()
    this.closePicker()
  }

  /**
   * Closes the picker
   */
  closePicker() {
    this.pickerClosed.emit()
  }

  @HostListener("document:click", ["$event"])
  closeOnOutsideClick(event: Event) {
    if (!this.isVisible) return

    const target = event.target as HTMLElement

    if (
      target.closest(".picmo-container") ||
      target.closest(".hover-action-btn") ||
      target.classList.contains("hover-action-btn")
    ) {
      return
    }

    this.closePicker()
  }

  /**
   * Saves emoji usage statistics
   */
  private saveEmojiUsage() {
    localStorage.setItem("emojiUsage", JSON.stringify(this.emojiUsageCount))
  }

  /**
   * Loads emoji usage statistics
   */
  private loadEmojiUsage() {
    const stored = localStorage.getItem("emojiUsage")
    this.emojiUsageCount = stored ? JSON.parse(stored) : {}
  }
}