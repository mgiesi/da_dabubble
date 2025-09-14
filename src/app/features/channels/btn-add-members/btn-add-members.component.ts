import { Component, inject, input, InputSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { Channel } from '../../../shared/models/channel';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DlgAddMembersComponent } from '../dlg-add-members/dlg-add-members.component';
import { DlgMembersListComponent } from '../dlg-members-list/dlg-members-list.component';

@Component({
  selector: 'app-btn-add-members',
  imports: [],
  templateUrl: './btn-add-members.component.html',
  styleUrl: './btn-add-members.component.scss'
})
export class BtnAddMembersComponent {
  private channelFacade = inject(ChannelsFacadeService);
  dialog = inject(MatDialog);
  breakpointObserver = inject(BreakpointObserver);
  
  // Input variable to link this component with a channel
  channel: InputSignal<Channel | null> = input<Channel | null>(null);

  /**
   * Opens the profile details overlay.
   */
  openAddMemberDialog(triggerEl: HTMLElement) {
    const dialogRef = this.dialog.getDialogById('addMemberDialog');
    if (dialogRef) {
      dialogRef.close();
    } else {
      const isMobile = this.breakpointObserver.isMatched([
        '(max-width: 768px)',
      ]);
      if (isMobile) {
        this.openMobileDialog();
      } else {
        this.openDesktopDialog(triggerEl);
      }
    }
  }

  openDesktopDialog(triggerEl: HTMLElement) {
    const rect = triggerEl.getBoundingClientRect();
    const top = `${rect.bottom + 8}px`;
    const right = `${window.innerWidth - rect.right}px`
    this.dialog.open(DlgAddMembersComponent, {
      id: 'addMemberDialog',
      position: {
        top: top,
        right: right,
      },
      panelClass: 'no-top-right-radius-dialog',
      data: this.channel,
    });
  }

  openMobileDialog() {
    this.dialog.open(DlgMembersListComponent, {
      id: 'addMemberDialog',
      data: this.channel,
    });
  }
}
