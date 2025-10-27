import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { ChannelBadgeComponent } from '../../channels/channel-badge/channel-badge.component';
import { ProfileBadgeComponent } from '../../profile/profile-badge/profile-badge.component';
import { CommonModule } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ChannelsService } from '../../../core/repositories/channels.service';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter, map, startWith, BehaviorSubject, combineLatest, of, switchMap } from 'rxjs';
import { UsersService } from '../../../core/repositories/users.service';
import { ChannelNavigationService } from '../../../core/services/channel-navigation.service';
import { DmNavigationService } from '../../../core/services/dm-navigation.service';
import { MessagesService } from '../../../core/repositories/messages.service';
import { DirectMessagesService } from '../../../core/repositories/direct-messages.service';
import { ThreadNavigationService } from '../../../core/services/thread-navigation.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-searchbox',
  imports: [
    CommonModule,
    ProfileBadgeComponent,
    ChannelBadgeComponent
  ],
  templateUrl: './searchbox.component.html',
  styleUrl: './searchbox.component.scss'
})
export class SearchboxComponent {
  private usersFacade = inject(UsersFacadeService);
  private channelsFacade = inject(ChannelsFacadeService);
  private channelsService = inject(ChannelsService);
  private usersService = inject(UsersService);
  private router = inject(Router);
  private dmNavigationService = inject(DmNavigationService);
  private channelNavigationService = inject(ChannelNavigationService);
  private messagesService = inject(MessagesService);
  private directMessagesService = inject(DirectMessagesService);
  private threadNavigationService = inject(ThreadNavigationService);

  @ViewChild('searchInput', { static: false })
  searchInputRef?: ElementRef<HTMLInputElement>;
  private lastSearchInputValue: string | null = null;

  ngOnInit(): void {
    if (!this.searchInput$.value) {
      this.searchInput$.next('');
    }
  }

  showSearchLabel$: Observable<boolean> = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => this.checkShowLabel()),
    startWith(this.checkShowLabel())
  );

  searchInput$ = new BehaviorSubject<string>('');
  users$: Observable<any[]> = this.usersService.users$();

  get channels() {
    const user = this.usersFacade.currentUserSig();
    if (!user?.email || user.readonly) {
      return this.channelsFacade.channels();
    }
    return this.channelsFacade.visibleChannelsSig();
  }

  filteredResults$: Observable<any[]> = combineLatest([
    this.searchInput$,
    this.users$,
    this.channelsService.channels$(),
  ]).pipe(
    switchMap(([search, users, allChannels]) => {
      const user = this.usersFacade.currentUserSig();
      const channels = !user?.email || user.readonly
        ? allChannels
        : this.channelsFacade.visibleChannelsSig();
      return this.filterResultsWithMessages(search, users, channels);
    })
  );

  private checkShowLabel(): boolean {
    return !window.location.pathname.includes('imprint') &&
      !window.location.pathname.includes('privacy-policy');
  }

  private filterResultsWithMessages(
    search: string,
    users: any[],
    channels: any[]
  ): Observable<any[]> {
    if (search.startsWith('@')) {
      return of(this.filterUsersByAt(search, users));
    }
    if (search.startsWith('#')) {
      return of(this.filterChannelsByHash(search, channels));
    }
    return this.filterGeneral(search, users, channels);
  }

  private filterUsersByAt(search: string, users: any[]): any[] {
    const term = search.slice(1).toLowerCase();
    if (!term) {
      return users.map((u) => ({ ...u, _type: 'user' }));
    }
    return users
      .filter((u) => u.displayName?.toLowerCase().startsWith(term))
      .map((u) => ({ ...u, _type: 'user' }));
  }

  private filterChannelsByHash(search: string, channels: any[]): any[] {
    const term = search.slice(1).toLowerCase();
    if (!term) {
      return channels.map((c) => ({ ...c, _type: 'channel' }));
    }
    return channels
      .filter((c) => c.name?.toLowerCase().startsWith(term))
      .map((c) => ({ ...c, _type: 'channel' }));
  }

  private filterGeneral(
    search: string,
    users: any[],
    channels: any[]
  ): Observable<any[]> {
    const term = search.toLowerCase();
    if (term.length < 3) return of([]);

    return this.searchMessages(term, channels).pipe(
      map((messageResults) => {
        const userResults = this.getFilteredUsers(term, users);
        const channelResults = this.getFilteredChannels(term, channels);
        return [...userResults, ...channelResults, ...messageResults];
      })
    );
  }

  private getFilteredUsers(term: string, users: any[]): any[] {
    return users
      .filter((u) => u.displayName?.toLowerCase().includes(term))
      .map((u) => ({ ...u, _type: 'user' }));
  }

  private getFilteredChannels(term: string, channels: any[]): any[] {
    return channels
      .filter((c) => c.name?.toLowerCase().includes(term))
      .map((c) => ({ ...c, _type: 'channel' }));
  }

  private searchMessages(term: string, channels: any[]): Observable<any[]> {
    if (!channels || channels.length === 0) return of([]);

    const messageObservables = channels.map(channel =>
      this.getChannelMessages(channel, term)
    );

    return combineLatest(messageObservables).pipe(
      map((results) => results.flat())
    );
  }

  private getChannelMessages(channel: any, term: string): Observable<any[]> {
    return this.messagesService.getTopicsForChannel$(channel.id).pipe(
      switchMap((topics) => this.searchTopicMessages(channel, topics, term))
    );
  }

  private searchTopicMessages(
    channel: any,
    topics: any[],
    term: string
  ): Observable<any[]> {
    if (!topics || topics.length === 0) return of([]);

    const topicObservables = topics.map(topic =>
      this.messagesService.getMessagesForTopic$(channel.id, topic.id).pipe(
        map((messages) => this.filterTopicMessages(messages, term, channel))
      )
    );

    return combineLatest(topicObservables).pipe(
      map((results) => results.flat())
    );
  }

  private filterTopicMessages(
    messages: any[],
    term: string,
    channel: any
  ): any[] {
    return messages
      .filter((m) => m.text?.toLowerCase().includes(term))
      .map((m) => ({
        ...m,
        _type: 'message',
        channelName: channel.name,
        channelId: channel.id,
        isThreadReply: !!m.parentMessageId
      }));
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput$.next(value);
  }

  onSearchResultHover(item: any) {
    if (!this.searchInputRef?.nativeElement) return;

    if (this.lastSearchInputValue === null) {
      this.lastSearchInputValue = this.searchInputRef.nativeElement.value;
    }

    if (item?.displayName) {
      this.searchInputRef.nativeElement.value = '@' + item.displayName;
    } else if (item?.name) {
      this.searchInputRef.nativeElement.value = '#' + item.name;
    }
  }

  onSearchResultHoverEnd() {
    if (this.lastSearchInputValue !== null && this.searchInputRef?.nativeElement) {
      this.searchInputRef.nativeElement.value = this.lastSearchInputValue;
      this.lastSearchInputValue = null;
    }
  }

  private clearSearchInput() {
    this.searchInput$.next('');
    if (this.searchInputRef?.nativeElement) {
      this.searchInputRef.nativeElement.value = '';
      this.lastSearchInputValue = null;
    }
  }

  onDirectMessageClick(user: any) {
    const userId = user?.id || user;
    this.dmNavigationService.selectUser(userId);
    this.clearSearchInput();
  }

  onSearchBlur() {
    const value = this.searchInputRef?.nativeElement?.value || '';
    if (value.startsWith('@') || value.startsWith('#')) {
      this.clearSearchInput();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const input = this.searchInputRef?.nativeElement;
    const dropdown = document.querySelector('.autocomplete-dropdown');
    const target = event.target as Node;

    if (!input || (!input.value.startsWith('@') && !input.value.startsWith('#'))) {
      return;
    }
    if (input.contains(target) || (dropdown && dropdown.contains(target))) {
      return;
    }

    this.clearSearchInput();
  }

  onChannelClick(channel: any) {
    const channelId = channel?.id || channel;
    this.channelNavigationService.selectChannel(channelId);
    this.clearSearchInput();
  }

  async onMessageClick(message: any) {
    if (!message?.channelId) return;

    this.channelNavigationService.selectChannel(message.channelId);

    if (message.isThreadReply) {
      const parentMessage = await this.getParentMessage(message);
      setTimeout(() => {
        this.threadNavigationService.openThread(
          message.channelId,
          parentMessage,
          message.id
        );
      }, 300);
    } else {
      setTimeout(() => {
        this.highlightChatMessage(message.channelId, message.id);
      }, 300);
    }

    this.clearSearchInput();
  }

  private highlightChatMessage(channelId: string, messageId: string) {
    window.dispatchEvent(new CustomEvent('highlight-chat-message', {
      detail: { channelId, messageId }
    }));
  }

  private async getParentMessage(message: any): Promise<any> {
    if (!message.parentMessageId) return message;

    const messages = await firstValueFrom(
      this.messagesService.getMessagesForTopic$(message.channelId, message.topicId)
    );

    return messages.find(m => m.id === message.parentMessageId) || message;
  }
}
