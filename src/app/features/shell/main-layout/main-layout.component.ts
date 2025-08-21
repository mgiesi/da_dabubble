import { Component } from '@angular/core';
import { WorkspaceMenuComponent } from '../../../features/menu/workspace-menu/workspace-menu.component';
import { ChatAreaComponent } from '../../chat/chat-area/chat-area.component';
import { ThreadPanelComponent } from '../../chat/thread-panel/thread-panel.component';
import { ProfileMenuComponent } from "../../profile/profile-menu/profile-menu.component";

@Component({
  selector: 'app-main-layout',
  imports: [WorkspaceMenuComponent, ChatAreaComponent, ThreadPanelComponent, ProfileMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  // 3-column layout container
}