import {
  Component,
  inject,
  type OnInit,
  Output,
  EventEmitter,
  type OnDestroy,
} from '@angular/core';
import { DmNavigationService } from '../../../core/services/dm-navigation.service';
import { ChannelNavigationService } from '../../../core/services/channel-navigation.service';
import { NgFor } from '@angular/common';
import { DmOnlineLoggerService } from '../../../core/services/dm-online-logger.service';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ProfileBadgeComponent } from '../../profile/profile-badge/profile-badge.component';
import { Router } from '@angular/router';
import { LogoStateService } from '../../../core/services/logo-state.service';
import type { User } from '../../../shared/models/user';
import { MatDialog } from '@angular/material/dialog';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DlgCreateChannelComponent } from '../../channels/dlg-create-channel/dlg-create-channel.component';
import {
  MatBottomSheet,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-workspace-menu',
  imports: [NgFor, ProfileBadgeComponent],
  templateUrl: './workspace-menu.component.html',
  styleUrl: './workspace-menu.component.scss',
})
export class WorkspaceMenuComponent implements OnInit, OnDestroy {
  private dmOnlineLogger = inject(DmOnlineLoggerService);
  private dmNavigationService = inject(DmNavigationService);
  private channelNavigationService = inject(ChannelNavigationService);
  private logoState = inject(LogoStateService);
  private channelsFacade = inject(ChannelsFacadeService);
  private usersFacade = inject(UsersFacadeService);
  desktopDialog = inject(MatDialog);
  mobileDialog = inject(MatBottomSheet);
  mobileDialogRef: MatBottomSheetRef | undefined = undefined;
  private breakpointObserver = inject(BreakpointObserver);

  private dmSubscription?: any;
  private channelSubscription?: any;
  private backToWorkspaceSubscription?: any;

  @Output() channelSelected = new EventEmitter<string>();
  @Output() directMessageSelected = new EventEmitter<string>();

  workspaceName = 'Devspace';
  channelsClosed = false;
  dmClosed = false;
  readonly users = this.usersFacade.users;
  trackById = (_: number, u: User) => u.id;

  selectedChannelId: string | null = null;
  selectedUserId: string | null = null;

  get channels() {
    const user = this.usersFacade.currentUserSig();
    if (!user?.email || user.readonly) {
      return this.channelsFacade.channels();
    }
    return this.channelsFacade.visibleChannelsSig();
  }

  ngOnInit() {
    this.initializeDmOnlineLogger();
    this.setupDmSubscription();
    this.setupChannelSubscription();
    this.setupBackToWorkspaceSubscription();
    // Restore last selected channel or user from localStorage
    const lastChannelId = localStorage.getItem('lastSelectedChannelId');
    const lastUserId = localStorage.getItem('lastSelectedUserId');
    const channelsClosed = localStorage.getItem('channelsClosed');
    if (channelsClosed !== null) {
      this.channelsClosed = channelsClosed === 'true';
    }
    if (lastChannelId) {
      this.handleChannelSelection(lastChannelId);
      this.channelsClosed = false;
    } else if (lastUserId) {
      this.handleDmSelection(lastUserId);
    }
  }

  ngOnDestroy() {
    this.cleanupSubscriptions();
  }

  private initializeDmOnlineLogger() {
    const usersSafe = () => this.users() ?? [];
    this.dmOnlineLogger.watchDmUsersOnline(usersSafe as any);
  }

  private setupDmSubscription() {
    this.dmSubscription = this.dmNavigationService.dmSelected$.subscribe(
      (userId: string) => {
        this.handleDmSelection(userId);
      }
    );
  }

  private setupChannelSubscription() {
    this.channelSubscription =
      this.channelNavigationService.channelSelected$.subscribe(
        (channelId: string) => {
          this.handleChannelSelection(channelId);
        }
      );
  }

  private setupBackToWorkspaceSubscription() {
    this.backToWorkspaceSubscription = this.logoState.backToWorkspace.subscribe(
      () => {}
    );
  }

  private cleanupSubscriptions() {
    if (this.dmSubscription) this.dmSubscription.unsubscribe();
    if (this.channelSubscription) this.channelSubscription.unsubscribe();
    if (this.backToWorkspaceSubscription)
      this.backToWorkspaceSubscription.unsubscribe();
  }

  private handleDmSelection(userId: string) {
    this.selectedUserId = userId;
    this.selectedChannelId = null;
    localStorage.setItem('lastSelectedUserId', userId);
    localStorage.removeItem('lastSelectedChannelId');
  }

  private handleChannelSelection(channelId: string) {
    this.selectedChannelId = channelId;
    this.selectedUserId = null;
    localStorage.setItem('lastSelectedChannelId', channelId);
    localStorage.removeItem('lastSelectedUserId');
  }

  toggleChannels() {
  this.channelsClosed = !this.channelsClosed;
  localStorage.setItem('channelsClosed', String(this.channelsClosed));
  }

  toggleDirectMessages() {
    this.dmClosed = !this.dmClosed;
  }

  onChannelClick(channelId: string) {
  this.handleChannelSelection(channelId);
  this.channelsClosed = false;
  localStorage.setItem('channelsClosed', 'false');
  this.channelSelected.emit(channelId);
  }

  onDirectMessageClick(userId: string) {
    this.handleDmSelection(userId);
    this.directMessageSelected.emit(userId);
  }

  onChannelCreated(channelId: string) {
    if (channelId) {
      this.channelSelected.emit(channelId);
    }
  }

  onEditWorkspace() {
    // TODO: Implement workspace edit functionality
  }

  /**
   * Opens the profile details overlay.
   */
  openCreateChannelDialog() {
    const desktopDialogRef = this.desktopDialog.getDialogById(
      'btnCreateChannelDialog'
    );
    if (desktopDialogRef) {
      desktopDialogRef.close();
    } else if (this.mobileDialogRef) {
      this.mobileDialogRef.dismiss();
    } else {
      const isMobile = this.breakpointObserver.isMatched([
        '(max-width: 768px)',
      ]);
      if (isMobile) {
        this.openMobileDialog();
      } else {
        this.openDesktopDialog();
      }
    }
  }

  private openMobileDialog() {
    this.mobileDialogRef = this.mobileDialog.open(DlgCreateChannelComponent, {
      panelClass: 'full-screen-bottom-sheet',
    });
    this.mobileDialogRef.afterDismissed().subscribe(() => {
      this.mobileDialogRef = undefined;
    });
  }

  private openDesktopDialog() {
    this.desktopDialog.open(DlgCreateChannelComponent, {
      id: 'btnCreateChannelDialog',
    });
  }
}
