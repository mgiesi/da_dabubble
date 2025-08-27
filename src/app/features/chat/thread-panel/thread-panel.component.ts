import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { MessageItemComponent } from '../message-item/message-item.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { MessagesFacadeService, Message } from '../../../core/facades/messages-facade.service';

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
  
  threadMessages: Message[] = [];
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
   * Uses the dedicated thread subscription method.
   */
  private setupThreadSubscription() {
    if (!this.selectedChannelId || !this.message?.id) return;

    console.log(`[Thread] Setting up subscription for thread ${this.message.id}`);

    this.threadSubscription = this.messagesFacade.subscribeToThreadMessages(
      this.selectedChannelId,
      this.message.id,
      (messages) => {
        console.log(`[Thread] Received ${messages.length} thread messages`);
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
      console.log("[Thread] Cleaning up thread subscription");
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