import { Component, EventEmitter, computed, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { Input, Output } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { ProfileAvatarComponent } from '../../profile/profile-avatar/profile-avatar.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-message-item',
  imports: [NgClass, NgIf, NgFor, ProfileAvatarComponent, PickerComponent],
  templateUrl: './message-item.component.html',
  styleUrl: './message-item.component.scss'
})
export class MessageItemComponent {
  private cdr = inject(ChangeDetectorRef);
  @Input() isThreadView: boolean = false;
  @Input() message!: any;
  @Output() replyClicked = new EventEmitter<any>();

  private usersFacade = inject(UsersFacadeService);

  viewEmojiPicker = false;
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

  showEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.viewEmojiPicker = !this.viewEmojiPicker;
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native;
    this.selectedEmoji = emoji;  // Unicode Emoji direkt speichern
    this.viewEmojiPicker = false;
    console.log('Emoji selected:', emoji);
  }

  @HostListener('document:click', ['$event'])
  closeEmojiPicker(event: Event) {
    this.viewEmojiPicker = false;
  }

  trackByReaction(index: number, reaction: any): string {
    return `${reaction.emoji}-${reaction.count}`;
  }
}