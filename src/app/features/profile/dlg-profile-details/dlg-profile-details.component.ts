import { Component, computed, Inject, inject, Input, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';

@Component({
  selector: 'app-dlg-profile-details',
  imports: [MatDialogContent, NgIf, CommonModule],
  templateUrl: './dlg-profile-details.component.html',
  styleUrl: './dlg-profile-details.component.scss'
})
export class DlgProfileDetailsComponent {
  dialogRef = inject(MatDialogRef<DlgProfileDetailsComponent>);
  facade = inject(UsersFacadeService);

  readonly user = inject<Signal<User | null>>(MAT_DIALOG_DATA);

  readonly isSelf = this.facade.isCurrentUser(this.user);

  closeDialog() {
    this.dialogRef.close(false);
  }
}
