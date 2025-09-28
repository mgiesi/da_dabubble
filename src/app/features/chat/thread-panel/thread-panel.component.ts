import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { MessageItemComponent } from '../message-item/message-item.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { MessagesFacadeService } from '../../../core/facades/messages-facade.service';
import { ChannelMessage } from '../../../shared/models/channel-message';

@Component({
  selector: 'app-thread-panel',
  imports: [NgFor, MessageItemComponent, MessageInputComponent],
  templateUrl: './thread-panel.component.html',
  styleUrl: './thread-panel.component.scss'
})
export class ThreadPanelComponent implements OnInit, OnDestroy {
  @Input() message: any = null;
  @Input() currentChannelName: string = '';
  @Input() selectedChannelId: string | null = null;
  @Output() backToChat = new EventEmitter<void>();

  private logoState = inject(LogoStateService);
  private messagesFacade = inject(MessagesFacadeService);
  private cdr = inject(ChangeDetectorRef);
  
  threadMessages: ChannelMessage[] = [];
  private threadSubscription: (() => void) | null = null;

  ngOnInit() {
    this.logoState.setCurrentView('thread');
    this.setupThreadSubscription();
  }

  ngOnDestroy() {
    this.cleanupSubscription();
  }

  /**
   * Sets up real-time subscription for thread messages.
   */
  private setupThreadSubscription() {
    if (!this.selectedChannelId || !this.message?.id) return;

    this.threadSubscription = this.messagesFacade.subscribeToThreadMessages(
      this.selectedChannelId,
      this.message.id,
      (messages) => {
        this.threadMessages = messages;
        this.cdr.detectChanges();
      }
    );
  }

  /**
   * Cleans up thread message subscription.
   */
  private cleanupSubscription() {
    if (this.threadSubscription) {
      this.threadSubscription();
      this.threadSubscription = null;
    }
  }

  /**
   * Handles back navigation to chat (for mobile/tablet view).
   */
  onBackToChat() {
    this.backToChat.emit();
  }
}