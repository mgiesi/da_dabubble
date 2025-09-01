import { Component, inject, ViewChild, WritableSignal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { DlgProfileEditComponent } from '../dlg-profile-edit/dlg-profile-edit.component';
import { NgIf, CommonModule } from '@angular/common';
import { ChooseAvatarComponent } from "../../auth/auth-assets/choose-avatar/choose-avatar.component";
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-dlg-select-avatar',
  imports: [MatDialogContent, NgIf, CommonModule, ChooseAvatarComponent],
  templateUrl: './dlg-select-avatar.component.html',
  styleUrl: './dlg-select-avatar.component.scss'
})
export class DlgSelectAvatarComponent {
  dialogRef = inject(MatDialogRef<DlgProfileEditComponent>);
  facade = inject(UsersFacadeService);

  @ViewChild(ChooseAvatarComponent) private chooseAvatar?: ChooseAvatarComponent;
  readonly user = inject<WritableSignal<User | null>>(MAT_DIALOG_DATA);

  closeDialog() {
    this.dialogRef.close(false);
  }

  saveProfile() {
    const u = this.user();
    if (u && this.chooseAvatar) {
      this.facade.updateImgUrl(u.id ,this.chooseAvatar.avatarUrl);
      this.dialogRef.close(false);
    }
  }
}
