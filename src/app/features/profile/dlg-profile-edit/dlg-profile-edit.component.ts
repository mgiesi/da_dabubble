import { NgIf, CommonModule } from '@angular/common';
import { Component, inject, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { User } from '../../../shared/models/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dlg-profile-edit',
  imports: [MatDialogContent, NgIf, CommonModule, FormsModule],
  templateUrl: './dlg-profile-edit.component.html',
  styleUrl: './dlg-profile-edit.component.scss'
})
export class DlgProfileEditComponent {
  dialogRef = inject(MatDialogRef<DlgProfileEditComponent>);
  facade = inject(UsersFacadeService);

  readonly user = inject<WritableSignal<User | null>>(MAT_DIALOG_DATA);

  profileName: string = '';

  closeDialog() {
    this.dialogRef.close(false);
  }

  saveProfile() {
    const u = this.user();
    if (u) {
      this.facade.updateDisplayName(u.id, this.profileName);
    }    
    this.dialogRef.close(false);
  }

}
