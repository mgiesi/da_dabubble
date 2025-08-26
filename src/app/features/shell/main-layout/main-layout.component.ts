// src/app/features/shell/main-layout/main-layout.component.ts
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
  currentView: 'workspace' | 'chat' | 'thread' = 'workspace';
  
  private channelsFacade = inject(ChannelsFacadeService);

  /**
   * Handles channel selection from workspace menu.
   * Switches to chat view and sets selected channel.
   */
  onChannelSelected(channelId: string) {
    console.log('Main layout received channel:', channelId);
    this.selectedChannelId = channelId;
    this.currentView = 'chat';
  }

  /**
   * Handles thread opening from chat area.
   * Switches to thread view and sets selected thread.
   */
  onThreadOpened(message: any) {
    this.selectedThread = message;
    this.currentView = 'thread';
  }

  /**
   * Handles back navigation from thread to chat.
   * Only used on mobile/tablet layouts.
   */
  onBackToChat() {
    this.currentView = 'chat';
    this.selectedThread = null;
  }

  /**
   * Gets the current channel name for thread panel.
   * Returns channel name or empty string if no channel selected.
   */
  get currentChannelName(): string {
    if (!this.selectedChannelId) return '';
    
    const channels = this.channelsFacade.channels();
    const currentChannel = channels.find(c => c.id === this.selectedChannelId);
    return currentChannel?.name || '';
  }
}