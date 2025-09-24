import {
  Component,
  inject,
  OnInit,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { ChatNavigationService } from '../../../core/services/chat-navigation.service';
import { NgFor } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { ChannelCreateComponent } from '../../channels/channel-create/channel-create.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ProfileBadgeComponent } from '../../profile/profile-badge/profile-badge.component';
import { Router } from '@angular/router';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor, ChannelCreateComponent, ProfileBadgeComponent],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss',
})
export class WorkspaceMenuComponent implements OnInit, OnDestroy {
  private chatNavigationService = inject(ChatNavigationService);
  private dmSubscription?: any;
  private channelSubscription?: any;
  @Output() channelSelected = new EventEmitter<string>();
  @Output() directMessageSelected = new EventEmitter<string>();

  private router = inject(Router);
  private logoState = inject(LogoStateService);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);

  workspaceName = 'Devspace';
  channelsClosed = false;
  dmClosed = false;
  showChannelForm = false;
  readonly users = this.usersFacade.users;
  trackById = (_: number, u: User) => u.id;

  selectedChannelId: string | null = null;
  selectedUserId: string | null = null;

  get channels() {
    const user = this.usersFacade.currentUserSig();
    if (!user?.email || user.readonly) {
      return this.channelsFacade.channels();
    }
    return this.channelsFacade.visibleChannelsSig();
  }

  ngOnInit() {
    this.dmSubscription = this.chatNavigationService.dmSelected$.subscribe(
      (userId: string) => {
        this.selectedUserId = userId;
        this.selectedChannelId = null;
      }
    );
    this.channelSubscription =
      this.chatNavigationService.channelSelected$.subscribe(
        (channelId: string) => {
          this.selectedChannelId = channelId;
          this.selectedUserId = null;
        }
      );
  }

  ngOnDestroy() {
    if (this.dmSubscription) this.dmSubscription.unsubscribe();
    if (this.channelSubscription) this.channelSubscription.unsubscribe();
  }

  toggleChannels() {
    this.channelsClosed = !this.channelsClosed;
  }

  toggleDirectMessages() {
    this.dmClosed = !this.dmClosed;
  }

  onAddChannel() {
    this.showChannelForm = true;
  }

  onChannelClick(channelId: string) {
    this.selectedChannelId = channelId;
    this.selectedUserId = null;
    this.channelSelected.emit(channelId);
  }

  onDirectMessageClick(userId: string) {
    this.selectedUserId = userId;
    this.selectedChannelId = null;
    this.directMessageSelected.emit(userId);
  }

  onChannelCreated(channelId: string) {
    this.showChannelForm = false;
    if (channelId) {
      this.channelSelected.emit(channelId);
    }
  }

  onCloseChannelForm() {
    this.showChannelForm = false;
  }

  // (Removed duplicate onDirectMessageClick)

  onEditWorkspace() {
    // TODO: Implement workspace edit functionality
  }
}
