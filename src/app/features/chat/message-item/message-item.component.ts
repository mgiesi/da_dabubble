import { Component, EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { Output } from '@angular/core';



@Component({
  selector: 'app-message-item',
  imports: [NgClass, NgIf],
  template: `
<div class="message-wrapper" [ngClass]="{'own-message': message.isOwnMessage}">
  <img [src]="message.avatar" [alt]="message.user" class="avatar">
  <div class="message-content-wrapper">
    <div class="message-bubble">
      <div class="message-header">
        <span class="username">{{message.user}}</span>
        <span class="timestamp">{{message.time}}</span>
      </div>
      <p class="message-content">{{message.content}}</p>
    </div>
    <div class="message-actions" *ngIf="!message.isOwnMessage && !isThreadView">
      <button class="reply-btn" (click)="onReplyClick()">Antworten</button>
    </div>
  </div>
</div>
  `,
  styleUrl: './message-item.component.scss'
})
export class MessageItemComponent {
  @Input() isThreadView: boolean = false;
  @Input() message!: any;
  @Output() replyClicked = new EventEmitter<any>();

  onReplyClick() {
    this.replyClicked.emit(this.message);
  }
}