import { Component, inject, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersService } from '../../../core/repositories/users.service';
import { ChannelsService } from '../../../core/repositories/channels.service';
import { DmNavigationService } from '../../../core/services/dm-navigation.service';
import { ChannelNavigationService } from '../../../core/services/channel-navigation.service';
import { ProfileBadgeComponent } from '../../profile/profile-badge/profile-badge.component';
import { ChannelBadgeComponent } from '../../channels/channel-badge/channel-badge.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-new-message',
  imports: [
    CommonModule,
    ProfileBadgeComponent,
    ChannelBadgeComponent,
    MessageInputComponent
  ],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss'
})
export class NewMessageComponent {
  private usersFacade = inject(UsersFacadeService);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersService = inject(UsersService);
  private channelsService = inject(ChannelsService);
  private dmNavigationService = inject(DmNavigationService);
  private channelNavigationService = inject(ChannelNavigationService);

  @ViewChild('recipientInput') recipientInputRef?: ElementRef<HTMLInputElement>;

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
      return this.filterRecipients(search, users, channels);
    })
  );

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput$.next(value);
  }

  private filterRecipients(search: string, users: any[], channels: any[]): Observable<any[]> {
    if (search.startsWith('@')) {
      return of(this.filterUsersByAt(search, users));
    }
    if (search.startsWith('#')) {
      return of(this.filterChannelsByHash(search, channels));
    }
    if (this.isEmailFormat(search)) {
      return of(this.filterUsersByEmail(search, users));
    }
    return of([]);
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

  private filterUsersByEmail(search: string, users: any[]): any[] {
    const term = search.toLowerCase();
    return users
      .filter((u) => u.email?.toLowerCase().includes(term))
      .map((u) => ({ ...u, _type: 'user' }));
  }

  private isEmailFormat(value: string): boolean {
    return value.includes('@') && !value.startsWith('@');
  }

  onUserClick(user: any) {
    this.dmNavigationService.selectUser(user.id);
  }

  onChannelClick(channel: any) {
    this.channelNavigationService.selectChannel(channel.id);
  }
}