import { NgIf, CommonModule } from '@angular/common';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import {
  Component,
  effect,
  inject,
  Signal,
  WritableSignal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { User } from '../../../shared/models/user';
import { FormsModule } from '@angular/forms';
import { DlgSelectAvatarComponent } from '../dlg-select-avatar/dlg-select-avatar.component';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';
import { ChooseAvatarComponent } from '../../auth/auth-assets/choose-avatar/choose-avatar.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-dlg-profile-edit',
  imports: [
    MatDialogContent,
    NgIf,
    CommonModule,
    FormsModule,

    ChooseAvatarComponent,
  ],
  templateUrl: './dlg-profile-edit.component.html',
  styleUrl: './dlg-profile-edit.component.scss',
  animations: [fadeInOut],
})
export class DlgProfileEditComponent {
  dialogRef = inject(MatDialogRef<DlgProfileEditComponent>);
  facade = inject(UsersFacadeService);
  private dialog = inject(MatDialog);

  readonly dialogData = inject<{ userId: string | undefined }>(MAT_DIALOG_DATA);
  readonly userSig = toSignal(this.facade.getUser$(this.dialogData.userId!), { initialValue: null});

  fullName: string = '';
  private hasInitializedFromuser = false;
  customMinLengthError: boolean = false;
  selectedAvatarUrl: string | null = null;
  onAvatarChanged(url: string) {
    this.selectedAvatarUrl = url;
  }

  constructor() {
    effect(() => {
      const u = this.userSig();
      if (!this.hasInitializedFromuser && u?.displayName) {
        this.fullName = u.displayName;
        this.hasInitializedFromuser = true;
      }
    });
  }

  editAvatar() {
    const current = this.userSig();
    this.dialog.open(DlgSelectAvatarComponent, {
      data: structuredClone(current) as User | null,
    });
    /*this.dialog.open(DlgSelectAvatarComponent, {
      data: this.user
    });*/
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  saveProfile() {
    const u = this.userSig();
    if (u) {
      this.facade.updateDisplayName(u.id, this.fullName);
      if (this.selectedAvatarUrl) {
        this.facade.updateImgUrl(u.id, this.selectedAvatarUrl);
      }
    }
    this.dialogRef.close(false);
  }

  validateNameLength() {
    const cleanedName = this.fullName.replace(/\s/g, '');
    this.customMinLengthError = cleanedName.length < 4;
  }
}
