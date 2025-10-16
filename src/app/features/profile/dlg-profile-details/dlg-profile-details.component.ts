import {
  Component,
  computed,
  Inject,
  inject,
  Injector,
  Input,
  Signal,
  effect,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { DlgProfileEditComponent } from '../dlg-profile-edit/dlg-profile-edit.component';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DmNavigationService } from '../../../core/services/dm-navigation.service';

@Component({
  selector: 'app-dlg-profile-details',
  imports: [MatDialogContent, NgIf, CommonModule, ProfileAvatarComponent],
  templateUrl: './dlg-profile-details.component.html',
  styleUrl: './dlg-profile-details.component.scss',
})
export class DlgProfileDetailsComponent {
  private dialogRef = inject(MatDialogRef<DlgProfileDetailsComponent>);
  private facade = inject(UsersFacadeService);
  private injector = inject(Injector);
  private breakpointObserver = inject(BreakpointObserver);
  private dialog = inject(MatDialog);
  private dmNavigationService = inject(DmNavigationService);
  
  readonly dialogData = inject<{ userId: string | undefined }>(MAT_DIALOG_DATA);
  readonly userSig = toSignal(this.facade.getUser$(this.dialogData.userId!), { initialValue: null});
  readonly isSelf = this.facade.isCurrentUser(this.userSig);
  readonly presenceState = this.facade.presenceState(this.userSig, this.injector);
  
  closeDialog() {
    this.dialogRef.close(false);
  }

  /**
   * Opens direct message chat with the user
   */
  openDirectMessage(): void {
    const user = this.userSig()
    if (user?.id) {
      this.dmNavigationService.selectUser(user.id)
      this.closeDialog()
    }
  }

  /**
   * Opens the profile menu overlay.
   */
  openEditProfile() {
    const dialogRef = this.dialog.getDialogById('profileEditsDialog');
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
    }
  }

  openDesktopDialog() {
    this.dialog.open(DlgProfileEditComponent, {
      id: 'profileEditsDialog',
      position: {
        top: '120px',
        right: '16px',
      },
      panelClass: 'no-top-right-radius-dialog',
      data: { userId: this.userSig()?.id },
    });
  }

  openMobileDialog() {
    this.dialog.open(DlgProfileEditComponent, {
      id: 'profileEditsDialog',
      data: { userId: this.userSig()?.id },
    });
  }
}