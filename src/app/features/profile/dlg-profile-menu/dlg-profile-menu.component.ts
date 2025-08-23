import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { DlgProfileDetailsComponent } from '../dlg-profile-details/dlg-profile-details.component';

@Component({
  selector: 'app-dlg-profile-menu',
  imports: [MatDialogContent],
  templateUrl: './dlg-profile-menu.component.html',
  styleUrl: './dlg-profile-menu.component.scss'
})
export class DlgProfileMenuComponent {
  auth = inject(AuthService);
  router = inject(Router); 
  dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<DlgProfileMenuComponent>);

  /**
   * Sign out the current user and navigate back to the login page.
   */
  async signOut() {
    this.dialogRef.close(false);
    await this.auth.signOut();
    await firstValueFrom(this.auth.user$.pipe(
      filter(u => !u),
      take(1)
    ));
    await this.router.navigate(['/login']);
  }

  /**
   * Opens the profile menu overlay.
   */
  openProfileDetails() {
    this.dialog.open(DlgProfileDetailsComponent, {
      position: {
        top: "120px",
        right: "16px"
      },
      panelClass: 'no-top-right-radius-dialog',
      autoFocus: false
    });
  }
}
