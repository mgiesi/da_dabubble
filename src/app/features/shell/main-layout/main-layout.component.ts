import { Component, inject } from '@angular/core';
import { WorkspaceMenuComponent } from '../../../features/menu/workspace-menu/workspace-menu.component';
import { ChatAreaComponent } from '../../chat/chat-area/chat-area.component';
import { ThreadPanelComponent } from '../../chat/thread-panel/thread-panel.component';
import { NgIf } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';

@Component({
  selector: 'app-main-layout',
  imports: [WorkspaceMenuComponent, ChatAreaComponent, ThreadPanelComponent, NgIf],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  selectedChannelId: string | null = null;
  selectedThread: any = null;
  
  private channelsFacade = inject(ChannelsFacadeService);

  onChannelSelected(channelId: string) {
    console.log('Main layout received channel:', channelId);
    this.selectedChannelId = channelId;
  }

  onThreadOpened(message: any) {
    this.selectedThread = message;
  }

  get currentChannelName(): string {
    if (!this.selectedChannelId) return '';
    
    const channels = this.channelsFacade.channels();
    const currentChannel = channels.find(c => c.id === this.selectedChannelId);
    return currentChannel?.name || '';
  }
}