import { Component, Output, EventEmitter, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service'
import { MatDialog } from '@angular/material/dialog'
import { BreakpointObserver } from '@angular/cdk/layout'
import { DlgAssignMembersComponent } from '../dlg-assign-members/dlg-assign-members.component'

@Component({
  selector: 'app-channel-create',
  imports: [FormsModule],
  templateUrl: './channel-create.component.html',
  styleUrl: './channel-create.component.scss'
})
export class ChannelCreateComponent {
  @Output() close = new EventEmitter<void>()
  @Output() channelCreated = new EventEmitter<string>()

  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);

  // Form-Felder für Channel-Erstellung
  name = ''
  description = ''

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

  private closeDialog() {
    this.resetForm();
    this.close.emit();
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
        this.channelCreated.emit('channel-created');
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
        this.channelCreated.emit('channel-created');
      }
    })
  }
}