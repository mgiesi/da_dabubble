import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { MatDialog, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { FormsModule } from '@angular/forms';
import { DlgAssignMembersComponent } from '../dlg-assign-members/dlg-assign-members.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { CommonModule } from '@angular/common';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';

@Component({
  selector: 'app-dlg-create-channel',
  imports: [MatDialogContent, FormsModule, CommonModule],
  templateUrl: './dlg-create-channel.component.html',
  styleUrl: './dlg-create-channel.component.scss'
})
export class DlgCreateChannelComponent {
  @Output() close = new EventEmitter<void>()
  @Output() channelCreated = new EventEmitter<string>()

  private channelsFacade = inject(ChannelsFacadeService);
  private dialog = inject(MatDialog);
  parentDesktopDialogRef = inject(MatDialogRef<DlgCreateChannelComponent>, {
    optional: true,
  });
  parentMobileDialogRef = inject(MatBottomSheetRef<DlgCreateChannelComponent>, {
    optional: true,
  });
  private breakpointObserver = inject(BreakpointObserver);

  // Form-Felder für Channel-Erstellung
  name = ''
  description = ''
  channelExists: boolean = false;
  channelNameEmpty: boolean = true;
  hasUserTypedName: boolean = false;

  /**
   * Bricht Channel-Erstellung ab und schließt Dialog
   */
  onCancel() {
    this.resetForm()
    this.close.emit()
  }

  /**
   * Setzt alle Form-Felder zurück
   */
  private resetForm() {
    this.name = ''
    this.description = ''
  }

  public closeDialog() {
    this.resetForm();
    this.close.emit();    
    this.parentDesktopDialogRef?.close(false);
    this.parentMobileDialogRef?.dismiss(false);
  }

  onChannelChange() {
    this.hasUserTypedName = true;
    this.checkIfChannelExists();
  }

  checkIfChannelExists() {
    const channel = this.channelsFacade.getChannelByName(this.name);
    this.channelExists = channel != undefined && channel != null;
    this.channelNameEmpty = this.name != null && this.name.length <= 0;
  }

  /**
   * Opens the profile details overlay.
   */
  openAssignMemberDialog() {
    const dialogRef = this.dialog.getDialogById('btnAssignMemberDialog');
    if (dialogRef) {
      dialogRef.close();
    } else {
      const isMobile = this.breakpointObserver.isMatched([
        '(max-width: 768px)',
      ]);
      if (isMobile) {
        this.openMobileDialog();
      } else {
        this.openDesktopDialog();
      }
      this.closeDialog();
    }
  }

  private openDesktopDialog() {
    const dialogRef = this.dialog.open(DlgAssignMembersComponent, {
      id: 'btnAssignMemberDialog',
      panelClass: 'no-top-right-radius-dialog',
      data: { channelName: this.name, channelDescr: this.description },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channelCreated.emit(result);
      }
    })
  }

  private openMobileDialog() {
    const dialogRef = this.dialog.open(DlgAssignMembersComponent, {
      id: 'btnAssignMemberDialog',
      data: { channelName: this.name, channelDescr: this.description }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.channelCreated.emit(result);
      }
    })
  }
}
