import { Component, inject, signal, ViewChild, WritableSignal } from '@angular/core';
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
  private data = inject<User | null>(MAT_DIALOG_DATA);
  readonly user = signal<User | null>(this.data);



  closeDialog() {
    this.dialogRef.close(false);
  }

  saveProfile() {
    const u = this.user();
    if (u && this.chooseAvatar) {
      const localu = this.chooseAvatar.userLocal();
      if (localu) {
        this.facade.updateImgUrl(u.id, localu.imgUrl);
        this.dialogRef.close(false);
      }
    }
  }
}
