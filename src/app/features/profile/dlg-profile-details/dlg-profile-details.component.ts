import { Component, computed, Inject, inject, Injector, Input, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { DlgProfileEditComponent } from '../dlg-profile-edit/dlg-profile-edit.component';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';

@Component({
  selector: 'app-dlg-profile-details',
  imports: [MatDialogContent, NgIf, CommonModule, ProfileAvatarComponent],
  templateUrl: './dlg-profile-details.component.html',
  styleUrl: './dlg-profile-details.component.scss'
})
export class DlgProfileDetailsComponent {
  private dialogRef = inject(MatDialogRef<DlgProfileDetailsComponent>);
  private facade = inject(UsersFacadeService);
  private injector = inject(Injector);
  private dialog = inject(MatDialog);

  readonly user = inject<Signal<User | null>>(MAT_DIALOG_DATA);

  readonly isSelf = this.facade.isCurrentUser(this.user);

  readonly isOnline = this.facade.isOnline(this.user, this.injector);

  closeDialog() {
    this.dialogRef.close(false);
  }
  

  /**
   * Opens the profile menu overlay.
   */
  editProfile() {
    this.dialog.open(DlgProfileEditComponent, {
      position: {
        top: "120px",
        right: "16px"
      },
      panelClass: 'no-top-right-radius-dialog',      
      data: this.user
    });
  }
}
