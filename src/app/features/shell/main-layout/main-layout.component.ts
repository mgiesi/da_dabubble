import { Component, inject } from "@angular/core"
import { WorkspaceMenuComponent } from "../../../features/menu/workspace-menu/workspace-menu.component"
import { WorkspaceMenuTogglerComponent } from "../workspace-menu-toggler/workspace-menu-toggler.component"
import { ChatAreaComponent } from "../../chat/chat-area/chat-area.component"
import { ThreadPanelComponent } from "../../chat/thread-panel/thread-panel.component"
import { NgIf } from "@angular/common"
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service"
import { LogoStateService } from "../../../core/services/logo-state.service"

@Component({
  selector: "app-main-layout",
  imports: [WorkspaceMenuComponent, WorkspaceMenuTogglerComponent, ChatAreaComponent, ThreadPanelComponent, NgIf],
  templateUrl: "./main-layout.component.html",
  styleUrl: "./main-layout.component.scss",
})
export class MainLayoutComponent {
  selectedChannelId: string | null = null
  selectedThread: any = null
  currentView: "workspace" | "chat" | "thread" = "workspace"
  isWorkspaceMenuOpen = false

  private channelsFacade = inject(ChannelsFacadeService)
  private logoState = inject(LogoStateService)
  logo = inject(LogoStateService);

  /**
   * Toggles workspace menu visibility on desktop.
   * Only affects desktop view above 768px.
   */
  onToggleWorkspaceMenu() {
    this.isWorkspaceMenuOpen = !this.isWorkspaceMenuOpen
  }

  /**
   * Handles channel selection from workspace menu.
   * Switches to chat view and sets selected channel.
   */
  onChannelSelected(channelId: string) {
    if (channelId === "back-to-workspace") {
      this.currentView = "workspace"
      this.logoState.setCurrentView("workspace")
      return
    }

    this.selectedChannelId = channelId
    this.currentView = "chat"
    this.logoState.setCurrentView("chat")
    this.logoState.setCurrentChannelName(this.currentChannelName)
  }

  /**
   * Handles thread opening from chat area.
   * Switches to thread view and sets selected thread.
   */
  onThreadOpened(message: any) {
    this.selectedThread = message
    this.currentView = "thread"
    this.logoState.setCurrentView("thread")
  }

  /**
   * Handles back navigation from thread to chat.
   * Only used on mobile/tablet layouts.
   */
  onBackToChat() {
    this.currentView = "chat"
    this.selectedThread = null
    this.logoState.setCurrentView("chat")
  }

  /**
   * Gets the current channel name for thread panel.
   * Returns channel name or empty string if no channel selected.
   */
  get currentChannelName(): string {
    if (!this.selectedChannelId) return ""

    const channels = this.channelsFacade.channels()
    const currentChannel = channels.find((c) => c.id === this.selectedChannelId)
    return currentChannel?.name || ""
  }
}