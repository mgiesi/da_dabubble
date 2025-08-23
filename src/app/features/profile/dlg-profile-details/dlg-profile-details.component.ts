import { Component, inject } from '@angular/core';
import { MatDialogContent, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dlg-profile-details',
  imports: [MatDialogContent],
  templateUrl: './dlg-profile-details.component.html',
  styleUrl: './dlg-profile-details.component.scss'
})
export class DlgProfileDetailsComponent {
  dialogRef = inject(MatDialogRef<DlgProfileDetailsComponent>);

  closeDialog() {
    this.dialogRef.close(false);
  }
}
