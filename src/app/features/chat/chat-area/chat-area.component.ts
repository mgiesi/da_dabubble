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
import { ChannelMessage } from '../../../shared/models/channel-message';
import { DirectMessage } from '../../../shared/models/direct-message';
import type { User } from '../../../shared/models/user';
import type { Channel } from '../../../shared/models/channel';
import { MessageItemComponent } from '../message-item/message-item.component';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { MessagesService } from '../../../core/repositories/messages.service';
import { MembersMiniaturInfoComponent } from '../../channels/members-miniatur-info/members-miniatur-info.component';
import { BtnAddMembersComponent } from '../../channels/btn-add-members/btn-add-members.component';
import { ProfileAvatarComponent } from '../../profile/profile-avatar/profile-avatar.component';
import { GlobalReactionService } from '../../../core/reactions/global-reaction.service';
import { aggregateReactions } from '../../../core/reactions/aggregate-reactions.util';
import { NewMessageComponent } from '../new-message/new-message.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { groupMessagesByDate } from '../../../shared/utils/timestamp';
import { ChatDialogService } from '../../../core/services/chat-dialog.service';
import { ChatScrollService } from '../../../core/services/chat-scroll.service';
import { Auth } from '@angular/fire/auth';
import { NotificationService } from '../../../core/services/notification.service';

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
export class ChatAreaComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private destroyed = false;
  @Input() channelId: string | null = null;
  @Input() userId: string | null = null;
  @Input() isDM = false;
  @Output() threadOpened = new EventEmitter<any>();
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: MessageInputComponent;

  private logoState = inject(LogoStateService);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);
  private messagesFacade = inject(MessagesFacadeService);
  private dmFacade = inject(DirectMessagesFacadeService);
  private cdr = inject(ChangeDetectorRef);
  private messagesService = inject(MessagesService);
  private chatDialog = inject(ChatDialogService);
  private chatScroll = inject(ChatScrollService);
  private globalReactions = inject(GlobalReactionService);

  private auth = inject(Auth);
  private notificationService = inject(NotificationService);

  private messageSubscription: (() => void) | null = null;
  private previousChannelId: string | null = null;
  private previousUserId: string | null = null;
  private boundHandleHighlightEvent: ((event: Event) => void) | null = null;

  editingMessage: any = null;
  dmUserSig: Signal<User | null> | null = null;
  currentChannel: Channel | null = null;
  createdByName = '';
  messages: (ChannelMessage | DirectMessage)[] = [];
  groupedMessages: { date: string; dateLabel: string; messages: any[] }[] = [];
  isLoadingMessages = false;
  showNewMessage = false;
  highlightedMessageId: string | null = null;

  private readonly currentUser$ = this.usersFacade.currentUser$;
  readonly currentUserSig = toSignal<User | null>(this.currentUser$, { initialValue: null });
  private readonly userIdSig = signal<string | null>(null);
  readonly isCurrentUser = computed(() => this.currentUserSig()?.id === this.userIdSig());

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

  ngAfterViewInit() { }

  async ngOnChanges() {
    this.checkNewMessageMode();
    const channelChanged = this.channelId !== this.previousChannelId;
    const userChanged = this.userId !== this.previousUserId;

    if (channelChanged || userChanged) {
      this.previousChannelId = this.channelId;
      this.previousUserId = this.userId;
      this.messages = [];
      this.cleanupSubscription();

      if (this.isDM && this.userId) {
        // ✅ Notify service welcher Chat aktiv ist
        this.notificationService.setActiveChat(this.userId);
        this.notificationService.clearUnread(this.userId);

        this.dmUserSig = this.usersFacade.getUserSig(this.userId);
        await this.initializeDM();
      } else if (this.channelId) {
        // ✅ Kein DM-Chat aktiv
        this.notificationService.setActiveChat(null);
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
    this.editingMessage = null;
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

  private async initializeDM() {
    if (!this.userId) return;

    this.isLoadingMessages = true;

    this.messageSubscription = this.dmFacade.subscribeToDMMessages(
      this.userId,
      (messages) => {
        this.messages = messages;
        this.groupedMessages = groupMessagesByDate(messages);
        this.isLoadingMessages = false;

        this.cdr.detectChanges();
        this.scrollToBottomAfterUpdate();
      }
    );
  }

  private async initializeChannel() {
    if (!this.channelId || this.destroyed) return;
    this.isLoadingMessages = true;
    await Promise.all([this.loadChannelData(), this.setupMessageSubscription()]);
    if (!this.destroyed) this.isLoadingMessages = false;
  }

  private async setupMessageSubscription() {
    const callback = (messages: any[]) => {
      this.messages = messages;
      this.groupedMessages = groupMessagesByDate(messages);
      this.globalReactions.setCounts(aggregateReactions(messages));
      this.cdr.detectChanges();
      this.scrollToBottomAfterUpdate();
    };

    if (this.isDM && this.userId) {
      this.messageSubscription = this.dmFacade.subscribeToDMMessages(this.userId, callback);
    } else if (this.channelId) {
      this.messageSubscription = this.messagesFacade.subscribeToChannelMessages(this.channelId, callback);
    }
  }

  private scrollToBottomAfterUpdate() {
    if (this.messagesContainer?.nativeElement) {
      this.chatScroll.scrollToBottomAfterUpdate(this.messagesContainer.nativeElement);
    }
  }

  private cleanupSubscription() {
    if (this.messageSubscription) {
      this.messageSubscription();
      this.messageSubscription = null;
    }
  }

  private async loadChannelData() {
    if (this.isDM && this.userId) {
      try {
        const user = await this.usersFacade.getUserById(this.userId);
        this.createdByName = user?.displayName || 'Unbekannt';
      } catch {
        this.createdByName = 'Unbekannt';
      }
      return;
    }

    const channels = this.channelsFacade.channels();
    this.currentChannel = channels.find((c) => c.id === this.channelId) || null;

    if (this.currentChannel?.ownerId) {
      const creator = this.usersFacade.users()?.find((u) => u.id === this.currentChannel?.ownerId);
      this.createdByName = creator?.displayName || 'Unbekannt';
    }
  }

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
      return user?.displayName ? `@ ${user.displayName}` : '@ Direct Message';
    }
    return `# ${this.currentChannel?.name || 'Entwicklerteam'}`;
  }

  get currentChatDescription(): string {
    return this.currentChannel?.description || '';
  }

  get dmUserDisplayName(): string {
    return this.dmUserSig?.()?.displayName || 'Unbekannt';
  }

  trackByMessageId(index: number, message: ChannelMessage | DirectMessage): string {
    return message.id || index.toString();
  }

  onReplyToMessage(message: ChannelMessage | DirectMessage) {
    this.threadOpened.emit(message);
  }

  openSettings() {
    if (this.isDM) {
      const user = this.dmUserSig?.();
      if (user?.id) this.chatDialog.openProfileDetails(user.id);
    } else {
      this.openChannelSettings();
    }
  }

  openChannelSettings() {
    if (!this.currentChannel?.id) return;

    this.chatDialog.openChannelSettings(
      {
        channelId: this.currentChannel.id,
        channelName: this.currentChannel.name || '',
        channelDescription: this.currentChannel.description || '',
        createdByName: this.createdByName
      },
      () => this.loadChannelData()
    );
  }

  private checkNewMessageMode() {
    this.showNewMessage = !this.channelId && !this.userId;
  }

  private setupHighlightListener() {
    this.boundHandleHighlightEvent = this.handleHighlightEvent.bind(this);
    window.addEventListener('highlight-chat-message', this.boundHandleHighlightEvent);
  }

  private cleanupHighlightListener() {
    if (this.boundHandleHighlightEvent) {
      window.removeEventListener('highlight-chat-message', this.boundHandleHighlightEvent);
      this.boundHandleHighlightEvent = null;
    }
  }

  private handleHighlightEvent(event: Event) {
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