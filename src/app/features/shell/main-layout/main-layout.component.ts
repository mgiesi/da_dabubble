import { Component, inject, type OnInit, type OnDestroy } from "@angular/core"
import { DmOnlineLoggerService } from "../../../features/menu/workspace-menu/dm-online-logger.service"
import { DmNavigationService } from "../../../core/services/dm-navigation.service"
import { ChannelNavigationService } from "../../../core/services/channel-navigation.service"
import { WorkspaceMenuComponent } from "../../../features/menu/workspace-menu/workspace-menu.component"
import { WorkspaceMenuTogglerComponent } from "../workspace-menu-toggler/workspace-menu-toggler.component"
import { ChatAreaComponent } from "../../chat/chat-area/chat-area.component"
import { ThreadPanelComponent } from "../../chat/thread-panel/thread-panel.component"
import { NgIf } from "@angular/common"
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { LogoStateService } from "../../../core/services/logo-state.service"
import { ThreadNavigationService, ThreadNavigationData } from '../../../core/services/thread-navigation.service';

@Component({
  selector: "app-main-layout",
  imports: [WorkspaceMenuComponent, WorkspaceMenuTogglerComponent, ChatAreaComponent, ThreadPanelComponent, NgIf],
  templateUrl: "./main-layout.component.html",
  styleUrl: "./main-layout.component.scss",
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private dmOnlineLogger = inject(DmOnlineLoggerService)
  private dmNavigationService = inject(DmNavigationService)
  private channelNavigationService = inject(ChannelNavigationService)
  private dmSubscription?: any
  private channelSubscription?: any

  private threadNavigationService = inject(ThreadNavigationService)
  private threadSubscription?: any

  selectedChannelId: string | null = null
  selectedUserId: string | null = null
  chatType: "channel" | "dm" = "channel"

  selectedThread: any = null
  highlightMessageId: string | null = null
  currentView: "workspace" | "chat" | "thread" = "chat"
  isWorkspaceMenuOpen = true
  userOnline = false
  lastOnlineUserName: string | null = null
  messageHide = false

  private channelsFacade = inject(ChannelsFacadeService)
  private usersFacade = inject(UsersFacadeService)
  private logoState = inject(LogoStateService)
  logo = inject(LogoStateService)

  ngOnInit() {
    this.initializeDefaultState()
    this.setupDmSubscription()
    this.setupChannelSubscription()
    this.setupThreadSubscription()
    this.setupBackToWorkspaceSubscription()
  }

  ngOnDestroy() {
    this.cleanupSubscriptions()
  }

  private setupDmSubscription() {
    this.dmSubscription = this.dmNavigationService.dmSelected$.subscribe((userId: string) => {
      this.handleDirectMessageSelection(userId)
    })
  }

  private setupChannelSubscription() {
    this.channelSubscription = this.channelNavigationService.channelSelected$.subscribe((channelId: string) => {
      this.handleChannelSelection(channelId)
    })
  }

  private setupThreadSubscription() {
    this.threadSubscription = this.threadNavigationService.threadOpened$.subscribe(
      (data) => this.handleThreadNavigation(data)
    )
  }

  private handleThreadNavigation(data: ThreadNavigationData) {
    this.selectedChannelId = data.channelId
    this.chatType = 'channel'
    this.highlightMessageId = data.highlightMessageId || null
    setTimeout(() => this.onThreadOpened(data.message), 100)
  }

  private cleanupSubscriptions() {
    if (this.dmSubscription) this.dmSubscription.unsubscribe()
    if (this.channelSubscription) this.channelSubscription.unsubscribe()
    if (this.threadSubscription) this.threadSubscription.unsubscribe()
  }

  private handleDirectMessageSelection(userId: string) {
    this.closeThread()
    this.resetChannelState()
    this.setDmState(userId)
    this.switchToChatView()
  }

  private handleChannelSelection(channelId: string) {
    if (channelId === "back-to-workspace") {
      this.switchToWorkspaceView()
      return
    }

    this.resetDmState()
    this.closeThread()
    this.setChannelState(channelId)
    this.updateChannelNameInService()
    this.switchToChatView()
  }

  private resetChannelState() {
    this.selectedChannelId = null
  }

  private resetDmState() {
    this.selectedUserId = null
  }

  private setDmState(userId: string) {
    this.selectedUserId = userId
    this.chatType = "dm"
  }

  private setChannelState(channelId: string) {
    this.selectedChannelId = channelId
    this.chatType = "channel"
  }

  private switchToChatView() {
    this.currentView = "chat"
    this.logoState.setCurrentView("chat")
  }

  private switchToWorkspaceView() {
    this.currentView = "workspace"
    this.logoState.setCurrentView("workspace")
  }

  private updateChannelNameInService() {
    if (!this.selectedChannelId) return

    const channels = this.channelsFacade.channels()
    const channel = channels.find((c) => c.id === this.selectedChannelId)

    if (channel?.name) {
      this.logoState.setCurrentChannelName(channel.name)
    }
  }

  private initializeDefaultState() {
    this.logoState.setCurrentView("chat")
    
    // Optional: Thread-State aus sessionStorage wiederherstellen
    const savedThreadId = sessionStorage.getItem('activeThreadId')
    const savedChannelId = sessionStorage.getItem('activeThreadChannelId')
    
    if (savedThreadId && savedChannelId) {
    }
    
    this.selectFirstAvailableChannel()
  }

  private selectFirstAvailableChannel() {
    const channels = this.channelsFacade.channels()

    if (channels && channels.length > 0) {
      const firstChannel = channels[0]
      this.selectedChannelId = firstChannel.id || null

      if (firstChannel.name) {
        this.logoState.setCurrentChannelName(firstChannel.name)
      }
    }
  }

  onToggleWorkspaceMenu() {
    this.isWorkspaceMenuOpen = !this.isWorkspaceMenuOpen
    // Thread-State bleibt unverändert - Thread schließt nur bei explizitem onBackToChat()
  }

  onDirectMessageSelected(userId: string) {
    this.handleDirectMessageSelection(userId)
  }

  onChannelSelected(channelId: string) {
    this.handleChannelSelection(channelId)
  }

  onThreadOpened(message: any) {
    this.selectedThread = message
    this.currentView = "thread"
    this.logoState.setCurrentView("thread")
    
    // Thread-State in sessionStorage sichern
    if (message?.id) {
      sessionStorage.setItem('activeThreadId', message.id)
      sessionStorage.setItem('activeThreadChannelId', this.selectedChannelId || '')
    }
  }

  onBackToChat() {
    console.log('🔙 Closing thread explicitly')
    this.currentView = "chat"
    this.selectedThread = null
    this.highlightMessageId = null
    this.logoState.setCurrentView("chat")
    
    // Thread-State aus sessionStorage entfernen
    sessionStorage.removeItem('activeThreadId')
    sessionStorage.removeItem('activeThreadChannelId')
  }

  get currentChannelName(): string {
    if (this.chatType === 'dm' && this.selectedUserId) {
      // DM: Zeige Username
      const users = this.usersFacade.users()
      if (users) {
        const dmUser = users.find(u => u.id === this.selectedUserId || u.uid === this.selectedUserId)
        return dmUser?.displayName || 'Direct Message'
      }
      return 'Direct Message'
    }
    
    // Channel: Zeige Channel-Name
    if (!this.selectedChannelId) return ""

    const channels = this.channelsFacade.channels()
    const currentChannel = channels.find((c) => c.id === this.selectedChannelId)
    return currentChannel?.name || ""
  }

  get isDM(): boolean {
    return this.chatType === "dm"
  }

  private setupBackToWorkspaceSubscription() {
    this.logoState.backToWorkspace.subscribe(() => {
      this.handleBackToWorkspace()
    })
  }

  private handleBackToWorkspace() {
    this.selectedChannelId = null
    this.selectedUserId = null
    this.currentView = 'workspace'
    this.logoState.setCurrentView('workspace')
  }
  private closeThread() {
    this.selectedThread = null
    this.highlightMessageId = null
    sessionStorage.removeItem('activeThreadId')
    sessionStorage.removeItem('activeThreadChannelId')
  }

}