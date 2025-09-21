import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { NgFor } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { ChannelCreateComponent } from '../../channels/channel-create/channel-create.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ProfileBadgeComponent } from "../../profile/profile-badge/profile-badge.component";
import { Router } from '@angular/router';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor, ChannelCreateComponent, ProfileBadgeComponent],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss'
})
export class WorkspaceMenuComponent implements OnInit {
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

  get channels() {
    return this.channelsFacade.visibleChannelsSig();
  }

  ngOnInit() {
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
    this.channelSelected.emit(channelId);
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

  /**
   * Handles direct message user click
   */
  onDirectMessageClick(userId: string) {
    this.directMessageSelected.emit(userId);
  }

  onEditWorkspace() {
    // TODO: Implement workspace edit functionality
  }
}