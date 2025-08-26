import { Component, Input, Output, EventEmitter } from '@angular/core';
import { inject } from '@angular/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { NgFor } from '@angular/common';
import { MessageItemComponent } from '../message-item/message-item.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { LogoStateService } from '../../../core/services/logo-state.service';
@Component({
  selector: 'app-thread-panel',
  imports: [NgFor, MessageItemComponent, MessageInputComponent],
  templateUrl: './thread-panel.component.html',
  styleUrl: './thread-panel.component.scss'
})
export class ThreadPanelComponent {
  @Input() message: any = null;
  @Input() currentChannelName: string = '';
  @Output() backToChat = new EventEmitter<void>();

  private logoState = inject(LogoStateService);
  private mockData = inject(MockDataService);

  ngOnInit() {
    this.logoState.setCurrentView('thread');
  }

  get threadMessages() {
    return this.message ? this.mockData.getThreadMessages(this.message.id) : [];
  }

  /**
   * Handles back navigation to chat (for mobile/tablet view).
   */
  onBackToChat() {
    this.backToChat.emit();
  }
}