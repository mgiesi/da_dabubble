import { Component, EventEmitter, computed, inject, ChangeDetectorRef } from '@angular/core';
import { Input, Output } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { ProfileAvatarComponent } from '../../profile/profile-avatar/profile-avatar.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { EmojiPickerComponent } from '../emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-message-item',
  imports: [NgClass, NgIf, NgFor, ProfileAvatarComponent, EmojiPickerComponent],
  templateUrl: './message-item.component.html',
  styleUrl: './message-item.component.scss'
})
export class MessageItemComponent {
  private cdr = inject(ChangeDetectorRef);
  @Input() isThreadView: boolean = false;
  @Input() message!: any;
  @Output() replyClicked = new EventEmitter<any>();

  private usersFacade = inject(UsersFacadeService);

  showEmojiPicker = false;
  selectedEmoji: string | null = null;

  messageUser = computed(() => {
    if (!this.message?.userId) return null;

    const allUsers = this.usersFacade.users();
    if (!allUsers || allUsers.length === 0) return null;

    return allUsers.find(user =>
      user.id === this.message.userId || user.uid === this.message.userId
    ) || null;
  });

  onReplyClick() {
    this.replyClicked.emit(this.message);
  }

  hasThreadReplies(): boolean {
    return !!this.message?.threadCount && this.message.threadCount > 0;
  }

  getThreadRepliesText(): string {
    const count = this.message?.threadCount || 0;
    return count === 1 ? '1 Antwort' : `${count} Antworten`;
  }

  getTopEmoji(index: number): string {
    const topEmojis = ['flexed_biceps', 'grinning_face_with_big_eyes'];
    return topEmojis[index] || '';
  }

  addReaction(emoji: string) {
    console.log('Reaction added:', emoji, 'to message:', this.message.id);
  }

  trackByReaction(index: number, reaction: any): string {
    return `${reaction.emoji}-${reaction.count}`;
  }

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    console.log('BEFORE toggle - showEmojiPicker:', this.showEmojiPicker);
    this.showEmojiPicker = !this.showEmojiPicker;
    console.log('AFTER toggle - showEmojiPicker:', this.showEmojiPicker);
    this.cdr.detectChanges();
    console.log('AFTER detectChanges - showEmojiPicker:', this.showEmojiPicker);
  }

  selectEmoji(emoji: string) {
    this.selectedEmoji = emoji;
    this.showEmojiPicker = false; // Schließt nach Auswahl
    this.cdr.detectChanges();
  }
}