import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { DlgProfileDetailsComponent } from '../dlg-profile-details/dlg-profile-details.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-dlg-profile-menu',
  imports: [MatDialogContent],
  templateUrl: './dlg-profile-menu.component.html',
  styleUrl: './dlg-profile-menu.component.scss',
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%' }),
        animate('250ms ease-out', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
  ],
  host: { '[@slideUp]': '' },
})
export class DlgProfileMenuComponent {
  auth = inject(AuthService);
  facade = inject(UsersFacadeService);
  router = inject(Router); 
  dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<DlgProfileMenuComponent>);

  readonly currentUserSig = toSignal(this.facade.currentUser(), { initialValue: null });
  
  /**
   * Sign out the current user and navigate back to the login page.
   */
  async signOut() {
    this.dialogRef.close(false);
    this.facade.signOut();
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
      data: this.currentUserSig
    });
  }
}
