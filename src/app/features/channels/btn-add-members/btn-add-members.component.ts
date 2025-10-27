import { Component, inject, input, InputSignal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Channel } from '../../../shared/models/channel';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AddMembersData, DlgAddMembersComponent } from '../dlg-add-members/dlg-add-members.component';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-btn-add-members',
  imports: [],
  templateUrl: './btn-add-members.component.html',
  styleUrl: './btn-add-members.component.scss'
})
export class BtnAddMembersComponent {
  desktopDialog = inject(MatDialog);
  mobileDialog = inject(MatBottomSheet);
  mobileDialogRef: MatBottomSheetRef | undefined = undefined;
  breakpointObserver = inject(BreakpointObserver);
  
  // Input variable to link this component with a channel
  channel: InputSignal<Channel | null> = input<Channel | null>(null);

  /**
   * Opens the profile details overlay.
   */
  openAddMemberDialog(triggerEl: HTMLElement) {
    const desktopDialogRef = this.desktopDialog.getDialogById(
      'btnAddMemberDialog'
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
        this.openMobileDialog(triggerEl);
      } else {
        this.openDesktopDialog(triggerEl);
      }
    }
  }

  openDesktopDialog(triggerEl: HTMLElement) {
    const rect = triggerEl.getBoundingClientRect();
    const top = `${rect.bottom + 8}px`;
    const right = `${window.innerWidth - rect.right}px`
    this.desktopDialog.open(DlgAddMembersComponent, {
      id: 'btnAddMemberDialog',
      position: {
        top: top,
        right: right,
      },
      panelClass: 'no-top-right-radius-dialog',
      data: { channel: this.channel } as AddMembersData,
    });
  }

  openMobileDialog(triggerEl: HTMLElement) {
    this.mobileDialogRef = this.mobileDialog.open(DlgAddMembersComponent, {
      panelClass: 'full-screen-bottom-sheet',
      data: { channel: this.channel, refElement: triggerEl } as AddMembersData
    });
    this.mobileDialogRef.afterDismissed().subscribe(() => {
      this.mobileDialogRef = undefined;
    });
  }
}
