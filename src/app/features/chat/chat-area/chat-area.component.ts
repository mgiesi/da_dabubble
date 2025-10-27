import {
  Component,
  Output,
  Input,
  inject,
  type OnInit,
  type OnChanges,
  EventEmitter,
  ChangeDetectorRef,
  type OnDestroy,
  ViewChild,
  type ElementRef,
  Renderer2,
  type AfterViewInit,
  Signal,
  signal,
  computed,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgFor, NgIf } from '@angular/common';
import { MessageInputComponent } from '../message-input/message-input.component';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { MessagesFacadeService } from '../../../core/facades/messages-facade.service';
import { DirectMessagesFacadeService } from '../../../core/facades/direct-messages-facade.service';
import { ChatStateService } from '../../../core/services/chat-state.service';
import { ChannelMessage } from '../../../shared/models/channel-message';
import { DirectMessage } from '../../../shared/models/direct-message';
import type { User } from '../../../shared/models/user';
import type { Channel } from '../../../shared/models/channel';
import { MessageItemComponent } from '../message-item/message-item.component';
import { Router } from '@angular/router';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { MessagesService } from '../../../core/repositories/messages.service';
import { MembersMiniaturInfoComponent } from '../../channels/members-miniatur-info/members-miniatur-info.component';
import { BtnAddMembersComponent } from '../../channels/btn-add-members/btn-add-members.component';
import { ProfileAvatarComponent } from '../../profile/profile-avatar/profile-avatar.component';
import { DlgProfileDetailsComponent } from '../../profile/dlg-profile-details/dlg-profile-details.component';
import { MatDialog } from '@angular/material/dialog';

import { GlobalReactionService } from '../../../core/reactions/global-reaction.service';
import { aggregateReactions } from '../../../core/reactions/aggregate-reactions.util';
import { DlgChannelSettingsComponent } from '../../channels/dlg-channel-settings/dlg-channel-settings.component';
import { NewMessageComponent } from '../new-message/new-message.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { formatDateSeparator, getDateKey } from '../../../shared/utils/timestamp';

@Component({
  selector: 'app-chat-area',
  imports: [
    MatCardModule,
    NgFor,
    NgIf,
    MessageInputComponent,
    MessageItemComponent,
    MembersMiniaturInfoComponent,
    BtnAddMembersComponent,
    ProfileAvatarComponent,
    NewMessageComponent
  ],
  templateUrl: './chat-area.component.html',
  styleUrl: './chat-area.component.scss',
})
export class ChatAreaComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private destroyed = false;
  @Input() channelId: string | null = null;
  @Input() highlightMessageId: string | null = null;
  @Output() threadOpened = new EventEmitter<any>();
  @ViewChild('messagesContainer', { static: false })
  messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: MessageInputComponent;

  private router = inject(Router);
  private logoState = inject(LogoStateService);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);
  private messagesFacade = inject(MessagesFacadeService);
  private dmFacade = inject(DirectMessagesFacadeService);
  private chatState = inject(ChatStateService);
  private cdr = inject(ChangeDetectorRef);
  private messagesService = inject(MessagesService);
  private renderer = inject(Renderer2);

  private messageSubscription: (() => void) | null = null;
  private previousChannelId: string | null = null;
  private previousUserId: string | null = null;

  dialog = inject(MatDialog);

  @Input() userId: string | null = null;
  @Input() isDM = false;

  editingMessage: any = null;
  dmUserSig: Signal<User | null> | null = null;
  currentChannel: Channel | null = null;
  createdByName = '';
  messages: (ChannelMessage | DirectMessage)[] = [];
  groupedMessages: { date: string; dateLabel: string; messages: any[] }[] = [];
  isLoadingMessages = false;
  showNewMessage = false;
  highlightedMessageId: string | null = null;

  private readonly currentUser$ = this.currentUser();
  readonly currentUserSig = toSignal<User | null>(this.currentUser$, {
    initialValue: null,
  });
  private readonly userIdSig = signal<string | null>(null);

  readonly isCurrentUser = computed(() =>
    this.currentUserSig()?.id === this.userIdSig()
  );

  private currentUser(): Observable<User | null> {
    return this.usersFacade.currentUser$;
  }
  constructor(private globalReactions: GlobalReactionService) { }

  async ngOnInit() {
    this.checkNewMessageMode();
    this.setupHighlightListener();

    if (this.isDM && this.userId) {
      this.dmUserSig = this.usersFacade.getUserSig(this.userId);
      await this.initializeDM();
    } else if (this.channelId) {
      await this.runMigration();
      await this.initializeChannel();
    }
    this.logoState.setCurrentView('chat');
  }

  ngAfterViewInit() {
    // ViewChild is available now
  }

  async ngOnChanges() {
    this.checkNewMessageMode();
    const channelChanged = this.channelId !== this.previousChannelId;
    const userChanged = this.userId !== this.previousUserId;

    if (channelChanged || userChanged) {
      this.previousChannelId = this.channelId;
      this.previousUserId = this.userId;
      this.messages = []; // Clear old messages
      this.cleanupSubscription();

      if (this.isDM && this.userId) {
        this.dmUserSig = this.usersFacade.getUserSig(this.userId);
        await this.initializeDM();
      } else if (this.channelId) {
        await this.initializeChannel();
      }
    }

    this.userIdSig.set(this.userId);
    if (this.messageInput) this.messageInput.focusAndClear();
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.cleanupSubscription();
    this.cleanupHighlightListener();
  }

  onEditMessage(message: any) {
    this.editingMessage = message;
  }

  onEditComplete() {
    this.editingMessage = null
  }

  async onDeleteMessage(message: any) {
    if (!confirm('Möchtest du diese Nachricht wirklich löschen?')) return;

    try {
      if (this.isDM && message.dmId && message.id) {
        await this.dmFacade.deleteDMMessage(message.dmId, message.id);
      } else if (this.channelId && message.id) {
        await this.messagesFacade.deleteMessage(this.channelId, message.topicId, message.id);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  /**
   * Initializes DM with user data and message subscription
   */
  private async initializeDM() {
    if (!this.userId || this.destroyed) return;

    this.isLoadingMessages = true;
    await Promise.all([this.setupMessageSubscription()]);
    if (this.destroyed) return;
    this.isLoadingMessages = false;
  }

  /**
   * Initializes channel with all data
   */
  private async initializeChannel() {
    if (!this.channelId || this.destroyed) return;

    this.isLoadingMessages = true;
    await Promise.all([
      this.loadChannelData(),
      this.setupMessageSubscription(),
    ]);
    if (this.destroyed) return;
    this.isLoadingMessages = false;
  }

  /**
   * Sets up message subscription with scroll
   */
  private async setupMessageSubscription() {
    if (this.isDM && this.userId) {
      this.messageSubscription = this.dmFacade.subscribeToDMMessages(
        this.userId,
        (messages) => {
          this.messages = messages;
          this.groupedMessages = this.groupMessagesByDate(messages);
          const counts = aggregateReactions(this.messages);
          this.globalReactions.setCounts(counts);
          this.cdr.detectChanges();
          this.scrollToBottomAfterUpdate();
        }
      );
      return;
    }

    if (!this.channelId) return;

    this.messageSubscription = this.messagesFacade.subscribeToChannelMessages(
      this.channelId,
      (messages) => {
        this.messages = messages;
        this.groupedMessages = this.groupMessagesByDate(messages);
        const counts = aggregateReactions(this.messages);
        this.globalReactions.setCounts(counts);
        this.cdr.detectChanges();
        this.scrollToBottomAfterUpdate();
      }
    );
  }

  private groupMessagesByDate(messages: any[]): { date: string; dateLabel: string; messages: any[] }[] {
    const groups = new Map<string, any[]>();

    messages.forEach(message => {
      const dateKey = getDateKey(message.timestamp);
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(message);
    });

    return Array.from(groups.entries()).map(([date, msgs]) => ({
      date,
      dateLabel: formatDateSeparator(msgs[0].timestamp),
      messages: msgs
    }));
  }

  /**
   * Scrolls to bottom after message update
   */
  private scrollToBottomAfterUpdate() {
    setTimeout(() => {
      this.scrollToBottom();
      this.waitForImagesToLoad();
    }, 1);
  }

  /**
   * Scrolls messages container to bottom
   */
  private scrollToBottom() {
    if (this.messagesContainer?.nativeElement) {
      const element = this.messagesContainer.nativeElement;
      this.renderer.setProperty(element, 'scrollTop', element.scrollHeight);
    }
  }

  /**
   * Waits for images and scrolls again
   */
  private waitForImagesToLoad() {
    if (!this.messagesContainer?.nativeElement) return;

    const images = this.messagesContainer.nativeElement.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    if (totalImages === 0) return;

    images.forEach((img: HTMLImageElement) => {
      if (img.complete) {
        loadedImages++;
        if (loadedImages === totalImages) {
          this.scrollToBottom();
        }
      } else {
        img.onload = () => {
          loadedImages++;
          if (loadedImages === totalImages) {
            this.scrollToBottom();
          }
        };
      }
    });
  }

  /**
   * Cleans up message subscription
   */
  private cleanupSubscription() {
    if (this.messageSubscription) {
      this.messageSubscription();
      this.messageSubscription = null;
    }
  }

  /**
   * Loads channel data from facade
   */
  private async loadChannelData() {
    if (this.isDM && this.userId) {
      try {
        const user = await this.usersFacade.getUserById(this.userId);
        this.createdByName = user?.displayName || 'Unbekannt';
      } catch (error) {
        console.error('Error loading DM user:', error);
        this.createdByName = 'Unbekannt';
      }
      return;
    }
    const channels = this.channelsFacade.channels();
    this.currentChannel = channels.find((c) => c.id === this.channelId) || null;

    if (this.currentChannel?.ownerId) {
      const allUsers = this.usersFacade.users();
      const creator = allUsers?.find(
        (user) => user.id === this.currentChannel?.ownerId
      );
      this.createdByName = creator?.displayName || 'Unbekannt';
    }
  }

  /**
   * Runs migration for old reactions
   */
  async runMigration() {
    if (this.destroyed) return;
    try {
      await this.messagesService.migrateOldReactions();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }

  get currentChatName(): string {
    if (this.isDM && this.dmUserSig) {
      const user = this.dmUserSig();
      if (user?.displayName) {
        return `@ ${user.displayName}`;
      }
      return '@ Direct Message';
    }
    return `# ${this.currentChannel?.name || 'Entwicklerteam'}`;
  }

  get currentChatDescription(): string {
    return this.currentChannel?.description || '';
  }

  trackByMessageId(index: number, message: ChannelMessage | DirectMessage): string {
    return message.id || index.toString();
  }

  onReplyToMessage(message: ChannelMessage | DirectMessage) {
    this.threadOpened.emit(message);
  }

  /**
   * Type guard to check if message is ChannelMessage
   */
  isChannelMessage(message: ChannelMessage | DirectMessage): message is ChannelMessage {
    return 'channelId' in message && 'topicId' in message;
  }

  /**
   * Type guard to check if message is DirectMessage
   */
  isDirectMessage(message: ChannelMessage | DirectMessage): message is DirectMessage {
    return 'dmId' in message && 'senderName' in message;
  }

  openThread(threadId: string) {
    this.logoState.setCurrentView('thread');
    if (this.logoState.showBackArrow()) {
      this.router.navigate(['/m/thread', threadId]);
    }
  }

  openSettings() {
    if (this.isDM) {
      this.openProfileDetails();
    } else {
      this.openChannelSettings();
    }
  }

  onSettingsSaved() {
    this.loadChannelData();
  }

  openChannelSettings() {
    const ref = this.dialog.open(DlgChannelSettingsComponent, {
      data: {
        channelId: this.currentChannel?.id,
        channelName: this.currentChannel?.name,
        channelDescription: this.currentChannel?.description,
        createdByName: this.createdByName
      }
    });

    const sub = ref.componentInstance.saved.subscribe(() => {
      this.onSettingsSaved();
    });

    ref.afterClosed().subscribe(() => sub.unsubscribe());
  }

  /**
   * Opens the profile info overlay.
   */
  openProfileDetails() {
    const user = this.dmUserSig?.();
    if (!user) return;
    this.dialog.open(DlgProfileDetailsComponent, {
      data: { userId: user.id },
    });
  }

  get dmUserDisplayName(): string {
    const user = this.dmUserSig?.()
    return user?.displayName || 'Unbekannt'
  }

  private checkNewMessageMode() {
    this.showNewMessage = !this.channelId && !this.userId;
  }

  private setupHighlightListener() {
    window.addEventListener('highlight-chat-message', this.handleHighlightEvent);
  }

  private cleanupHighlightListener() {
    window.removeEventListener('highlight-chat-message', this.handleHighlightEvent);
  }

  private handleHighlightEvent = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { channelId, messageId } = customEvent.detail;

    if (channelId === this.channelId) {
      this.highlightedMessageId = messageId;
      setTimeout(() => {
        this.highlightedMessageId = null;
        this.cdr.detectChanges();
      }, 2000);
      this.cdr.detectChanges();
    }
  }

}