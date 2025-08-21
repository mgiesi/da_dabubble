import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss'
})
export class WorkspaceMenuComponent {
  // TODO: Inject facades when available
  // private channelsFacade = inject(ChannelsFacadeService);
  // private usersFacade = inject(UsersFacadeService);
  // private workspaceFacade = inject(WorkspaceFacadeService);
  
  workspaceName = 'Devspace';
  channelsClosed = false;
  dmClosed = false;
  
  // Mock data - wird später durch Facade Signals ersetzt
  channels: any[] = [];
  
  directMessages: any[] = [];

  toggleChannels() {
    this.channelsClosed = !this.channelsClosed;
  }

  toggleDirectMessages() {
    this.dmClosed = !this.dmClosed;
  }

  onAddChannel() {
    // TODO: Emit event or call facade.createChannel()
    console.log('Add channel clicked');
  }

  onChannelClick(channelId: string) {
    // TODO: Emit event for parent to handle navigation
    console.log('Channel clicked:', channelId);
  }

  onDirectMessageClick(userId: string) {
    // TODO: Emit event for parent to handle DM navigation
    console.log('DM clicked:', userId);
  }

  onEditWorkspace() {
    // TODO: Emit event for workspace edit
    console.log('Edit workspace clicked');
  }
}