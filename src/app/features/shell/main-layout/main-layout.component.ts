import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DirectMessageService } from '../../../core/services/direct-message.service';
import { WorkspaceMenuComponent } from '../../../features/menu/workspace-menu/workspace-menu.component';
import { WorkspaceMenuTogglerComponent } from '../workspace-menu-toggler/workspace-menu-toggler.component';
import { ChatAreaComponent } from '../../chat/chat-area/chat-area.component';
import { ThreadPanelComponent } from '../../chat/thread-panel/thread-panel.component';
import { NgIf } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { LogoStateService } from '../../../core/services/logo-state.service';

@Component({
  selector: 'app-main-layout',
  imports: [
    WorkspaceMenuComponent,
    WorkspaceMenuTogglerComponent,
    ChatAreaComponent,
    ThreadPanelComponent,
    NgIf,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private directMessageService = inject(DirectMessageService);
  private dmSubscription?: any;
  selectedChannelId: string | null = null;
  selectedThread: any = null;
  currentView: 'workspace' | 'chat' | 'thread' = 'chat';
  isWorkspaceMenuOpen = true;

  private channelsFacade = inject(ChannelsFacadeService);
  private logoState = inject(LogoStateService);
  logo = inject(LogoStateService);

  selectedUserId: string | null = null;
  chatType: 'channel' | 'dm' = 'channel';

  ngOnInit() {
    this.initializeDefaultState();
    this.dmSubscription = this.directMessageService.dmSelected$.subscribe(
      (userId: string) => {
        this.onDirectMessageSelected(userId);
      }
    );
  }

  ngOnDestroy() {
    if (this.dmSubscription) this.dmSubscription.unsubscribe();
  }

  /**
   * Sets up default layout with workspace menu and first channel
   */
  private initializeDefaultState() {
    // Set initial view state
    this.logoState.setCurrentView('chat');

    // Auto-select first available channel
    this.selectFirstAvailableChannel();
  }

  /**
   * Auto-selects first channel if available
   */
  private selectFirstAvailableChannel() {
    const channels = this.channelsFacade.channels();
    if (channels && channels.length > 0) {
      const firstChannel = channels[0];
      this.selectedChannelId = firstChannel.id || null;
      if (firstChannel.name) {
        this.logoState.setCurrentChannelName(firstChannel.name);
      }
    }
  }

  /**
   * Toggles workspace menu visibility on desktop.
   * Closes thread when workspace opens.
   */
  onToggleWorkspaceMenu() {
    this.isWorkspaceMenuOpen = !this.isWorkspaceMenuOpen;

    // Workspace öffnen schließt Thread
    if (this.isWorkspaceMenuOpen && this.currentView === 'thread') {
      this.currentView = 'chat';
      this.selectedThread = null;
      this.logoState.setCurrentView('chat');
    }
  }

  /**
   * Handles direct message selection from workspace menu
   */
  onDirectMessageSelected(userId: string) {
    this.selectedUserId = userId;
    this.selectedChannelId = null;
    this.chatType = 'dm';
    this.currentView = 'chat';
    this.logoState.setCurrentView('chat');
  }

  /**
   * Handles channel selection from workspace menu.
   * Switches to chat view and sets selected channel.
   */
  onChannelSelected(channelId: string) {
    if (channelId === 'back-to-workspace') {
      this.currentView = 'workspace';
      this.logoState.setCurrentView('workspace');
      return;
    }

    this.selectedChannelId = channelId;
    this.selectedUserId = null;
    this.chatType = 'channel';
    this.currentView = 'chat';
    this.logoState.setCurrentView('chat');
    this.logoState.setCurrentChannelName(this.currentChannelName);
  }

  /**
   * Handles thread opening from chat area.
   * Switches to thread view and sets selected thread.
   */
  onThreadOpened(message: any) {
    this.selectedThread = message;
    this.currentView = 'thread';
    this.logoState.setCurrentView('thread');
  }

  /**
   * Handles back navigation from thread to chat.
   * Only used on mobile/tablet layouts.
   */
  onBackToChat() {
    this.currentView = 'chat';
    this.selectedThread = null;
    this.logoState.setCurrentView('chat');
  }

  /**
   * Gets the current channel name for thread panel.
   * Returns channel name or empty string if no channel selected.
   */
  get currentChannelName(): string {
    if (!this.selectedChannelId) return '';

    const channels = this.channelsFacade.channels();
    const currentChannel = channels.find(
      (c) => c.id === this.selectedChannelId
    );
    return currentChannel?.name || '';
  }
}
