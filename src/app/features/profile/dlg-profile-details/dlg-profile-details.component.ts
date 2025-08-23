import { Component, computed, Inject, inject, Input, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../shared/models/user';
import { NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';

@Component({
  selector: 'app-dlg-profile-details',
  imports: [MatDialogContent, NgIf],
  templateUrl: './dlg-profile-details.component.html',
  styleUrl: './dlg-profile-details.component.scss'
})
export class DlgProfileDetailsComponent {
  dialogRef = inject(MatDialogRef<DlgProfileDetailsComponent>);

  readonly user = inject<Signal<User | null>>(MAT_DIALOG_DATA);

  private readonly facade = inject(UsersFacadeService);
  private readonly me = toSignal(this.facade.currentUser(), { initialValue: null });

  readonly isSelf = computed(() => {
    const u = this.user();
    const m = this.me();
    return !!u && !!m && u.id === m.id;
  });

  closeDialog() {
    this.dialogRef.close(false);
  }
}
