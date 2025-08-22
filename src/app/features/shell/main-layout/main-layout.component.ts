import { Component } from '@angular/core';
import { WorkspaceMenuComponent } from '../../../features/menu/workspace-menu/workspace-menu.component';
import { ChatAreaComponent } from '../../chat/chat-area/chat-area.component';
import { ThreadPanelComponent } from '../../chat/thread-panel/thread-panel.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  imports: [WorkspaceMenuComponent, ChatAreaComponent, ThreadPanelComponent, NgIf],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  selectedChannelId: string | null = null;

  onChannelSelected(channelId: string) {
    console.log('Main layout received channel:', channelId);
    this.selectedChannelId = channelId;
  }
}