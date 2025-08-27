import { Component, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { NgFor } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { ChannelFormComponent } from '../../channels/channel-form/channel-form.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ProfileBadgeComponent } from "../../profile/profile-badge/profile-badge.component";
import { Router } from '@angular/router';
import { LogoStateService } from '../../../core/services/logo-state.service';
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor, ChannelFormComponent, ProfileBadgeComponent],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss'
})
export class WorkspaceMenuComponent implements OnInit {
  @Output() channelSelected = new EventEmitter<string>();
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
    return this.channelsFacade.channels();
  }

  ngOnInit() {
    console.log('Channels loaded via signal:', this.channels);
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
    console.log('Channel selected:', channelId);
    this.channelSelected.emit(channelId);
  }

  onDirectMessageClick(userId: string) {
    console.log('DM clicked:', userId);
  }

  onEditWorkspace() {
    console.log('Edit workspace clicked');
  }

  closeChannelForm() {
    this.showChannelForm = false;
  }
}