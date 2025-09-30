import { Component, inject, type OnInit, Output, EventEmitter, type OnDestroy } from "@angular/core"
import { DmNavigationService } from "../../../core/services/dm-navigation.service"
import { ChannelNavigationService } from "../../../core/services/channel-navigation.service"
import { NgFor } from "@angular/common"
import { DmOnlineLoggerService } from "../../../core/services/dm-online-logger.service"
import { ChannelsFacadeService } from "../../../core/facades/channels-facade.service"
import { ChannelCreateComponent } from "../../channels/channel-create/channel-create.component"
import { UsersFacadeService } from "../../../core/facades/users-facade.service"
import { ProfileBadgeComponent } from "../../profile/profile-badge/profile-badge.component"
import { Router } from "@angular/router"
import { LogoStateService } from "../../../core/services/logo-state.service"
import type { User } from "../../../shared/models/user"

@Component({
  selector: "app-workspace-menu",
  imports: [NgFor, ChannelCreateComponent, ProfileBadgeComponent],
  templateUrl: "./workspace-menu.component.html",
  styleUrl: "./workspace-menu.component.scss",
})
export class WorkspaceMenuComponent implements OnInit, OnDestroy {
  private dmOnlineLogger = inject(DmOnlineLoggerService)
  private dmNavigationService = inject(DmNavigationService)
  private channelNavigationService = inject(ChannelNavigationService)
  private logoState = inject(LogoStateService)
  private router = inject(Router)
  private channelsFacade = inject(ChannelsFacadeService)
  private usersFacade = inject(UsersFacadeService)

  private dmSubscription?: any
  private channelSubscription?: any
  private backToWorkspaceSubscription?: any

  @Output() channelSelected = new EventEmitter<string>()
  @Output() directMessageSelected = new EventEmitter<string>()

  workspaceName = "Devspace"
  channelsClosed = false
  dmClosed = false
  showChannelForm = false
  readonly users = this.usersFacade.users
  trackById = (_: number, u: User) => u.id

  selectedChannelId: string | null = null
  selectedUserId: string | null = null

  get channels() {
    const user = this.usersFacade.currentUserSig()
    if (!user?.email || user.readonly) {
      return this.channelsFacade.channels()
    }
    return this.channelsFacade.visibleChannelsSig()
  }

  ngOnInit() {
    this.initializeDmOnlineLogger()
    this.setupDmSubscription()
    this.setupChannelSubscription()
    this.setupBackToWorkspaceSubscription()
  }

  ngOnDestroy() {
    this.cleanupSubscriptions()
  }

  private initializeDmOnlineLogger() {
    const usersSafe = () => this.users() ?? []
    this.dmOnlineLogger.watchDmUsersOnline(usersSafe as any)
  }

  private setupDmSubscription() {
    this.dmSubscription = this.dmNavigationService.dmSelected$.subscribe((userId: string) => {
      this.handleDmSelection(userId)
    })
  }

  private setupChannelSubscription() {
    this.channelSubscription = this.channelNavigationService.channelSelected$.subscribe((channelId: string) => {
      this.handleChannelSelection(channelId)
    })
  }

  private setupBackToWorkspaceSubscription() {
    this.backToWorkspaceSubscription = this.logoState.backToWorkspace.subscribe(() => {
      this.showChannelForm = false
    })
  }

  private cleanupSubscriptions() {
    if (this.dmSubscription) this.dmSubscription.unsubscribe()
    if (this.channelSubscription) this.channelSubscription.unsubscribe()
    if (this.backToWorkspaceSubscription) this.backToWorkspaceSubscription.unsubscribe()
  }

  private handleDmSelection(userId: string) {
    this.selectedUserId = userId
    this.selectedChannelId = null
  }

  private handleChannelSelection(channelId: string) {
    this.selectedChannelId = channelId
    this.selectedUserId = null
  }

  toggleChannels() {
    this.channelsClosed = !this.channelsClosed
  }

  toggleDirectMessages() {
    this.dmClosed = !this.dmClosed
  }

  onAddChannel() {
    this.showChannelForm = true
  }

  onChannelClick(channelId: string) {
    this.handleChannelSelection(channelId)
    this.channelSelected.emit(channelId)
  }

  onDirectMessageClick(userId: string) {
    this.handleDmSelection(userId)
    this.directMessageSelected.emit(userId)
  }

  onChannelCreated(channelId: string) {
    this.showChannelForm = false
    if (channelId) {
      this.channelSelected.emit(channelId)
    }
  }

  onCloseChannelForm() {
    this.showChannelForm = false
  }

  onEditWorkspace() {
    // TODO: Implement workspace edit functionality
  }
}