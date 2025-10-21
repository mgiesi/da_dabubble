import { Component, ElementRef, HostListener, inject, ViewChild } from '@angular/core';
import { ChannelBadgeComponent } from '../../channels/channel-badge/channel-badge.component';
import { ProfileBadgeComponent } from '../../profile/profile-badge/profile-badge.component';
import { CommonModule } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ChannelsService } from '../../../core/repositories/channels.service';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter, map, startWith, BehaviorSubject, combineLatest } from 'rxjs';
import { UsersService } from '../../../core/repositories/users.service';
import { ChannelNavigationService } from '../../../core/services/channel-navigation.service';
import { DmNavigationService } from '../../../core/services/dm-navigation.service';

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

  @ViewChild('searchInput', { static: false })
  searchInputRef?: ElementRef<HTMLInputElement>;
  private lastSearchInputValue: string | null = null;


  ngOnInit(): void {
    // Dropdown nach Reload ausblenden, wenn Input leer
    if (!this.searchInput$.value) {
      this.searchInput$.next('');
    }
  }

  showSearchLabel$: Observable<boolean> = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(
      () =>
        !window.location.pathname.includes('imprint') &&
        !window.location.pathname.includes('privacy-policy')
    ),
    startWith(
      !window.location.pathname.includes('imprint') &&
        !window.location.pathname.includes('privacy-policy')
    )
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
    map(([search, users, allChannels]) => {
      const user = this.usersFacade.currentUserSig();
      const channels =
        !user?.email || user.readonly
          ? allChannels
          : this.channelsFacade.visibleChannelsSig();
      return this.filterResults(search, users, channels);
    })
  );

  private filterResults(search: string, users: any[], channels: any[]): any[] {
    if (search.startsWith('@')) return this.filterUsersByAt(search, users);
    if (search.startsWith('#'))
      return this.filterChannelsByHash(search, channels);
    return this.filterGeneral(search, users, channels);
  }

  private filterUsersByAt(search: string, users: any[]): any[] {
    const term = search.slice(1).toLowerCase();
    if (!term) return users;
    return users.filter((u) => u.displayName?.toLowerCase().startsWith(term));
  }

  private filterChannelsByHash(search: string, channels: any[]): any[] {
    const term = search.slice(1).toLowerCase();
    if (!term) return channels;
    return channels.filter((c) => c.name?.toLowerCase().startsWith(term));
  }

  private filterGeneral(search: string, users: any[], channels: any[]): any[] {
    const term = search.toLowerCase();
    if (term.length < 3) return [];
    const userResults = users
      .filter((u) => u.displayName?.toLowerCase().includes(term))
      .map((u) => ({ ...u, _type: 'user' }));
    const channelResults = channels
      .filter((c) => c.name?.toLowerCase().includes(term))
      .map((c) => ({ ...c, _type: 'channel' }));
    return [...userResults, ...channelResults];
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput$.next(value);
  }

  onSearchResultHover(item: any) {
    if (this.searchInputRef?.nativeElement) {
      if (this.lastSearchInputValue === null) {
        this.lastSearchInputValue = this.searchInputRef.nativeElement.value;
      }
      if (item?.displayName) {
        this.searchInputRef.nativeElement.value = '@' + item.displayName;
      } else if (item?.name) {
        this.searchInputRef.nativeElement.value = '#' + item.name;
      }
    }
  }

  onSearchResultHoverEnd() {
    if (
      this.lastSearchInputValue !== null &&
      this.searchInputRef?.nativeElement
    ) {
      this.searchInputRef.nativeElement.value = this.lastSearchInputValue;
      this.lastSearchInputValue = null;
    }
  }

  private clearSearchInput() {
    this.searchInput$.next('');
    if (this.searchInputRef?.nativeElement) {
      this.searchInputRef.nativeElement.value = '';
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
    if (
      !input ||
      (!input.value.startsWith('@') && !input.value.startsWith('#'))
    )
      return;
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
}
