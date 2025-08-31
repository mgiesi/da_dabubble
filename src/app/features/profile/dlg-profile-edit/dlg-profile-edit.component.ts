import { NgIf, CommonModule } from '@angular/common';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { Component, effect, inject, Signal, WritableSignal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { User } from '../../../shared/models/user';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dlg-profile-edit',
  imports: [MatDialogContent, NgIf, CommonModule, FormsModule],
  templateUrl: './dlg-profile-edit.component.html',
  styleUrl: './dlg-profile-edit.component.scss',
  animations: [fadeInOut],
})
export class DlgProfileEditComponent {
  dialogRef = inject(MatDialogRef<DlgProfileEditComponent>);
  facade = inject(UsersFacadeService);

  readonly user = inject<WritableSignal<User | null>>(MAT_DIALOG_DATA);

  fullName: string = '';
  private hasInitializedFromuser = false;
  customMinLengthError: boolean = false;

  constructor() {
    effect(() => {
      const u = this.user();
      if (!this.hasInitializedFromuser && u?.displayName) {
        this.fullName = u.displayName;
        this.hasInitializedFromuser = true;
      }
    })
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  saveProfile() {
    const u = this.user();
    if (u) {
      this.facade.updateDisplayName(u.id, this.fullName);
    }    
    this.dialogRef.close(false);
  }

  validateNameLength() {
    const cleanedName = this.fullName.replace(/\s/g, '');
    this.customMinLengthError = cleanedName.length < 4;
  }

}
