import { Component, inject } from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { DlgProfileMenuComponent } from '../dlg-profile-menu/dlg-profile-menu.component';
import { MatDialog } from '@angular/material/dialog';
import { ProfileAvatarComponent } from "../profile-avatar/profile-avatar.component";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-profile-menu',
  imports: [CommonModule, ProfileAvatarComponent],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss'
})
export class ProfileMenuComponent {
  facade = inject(UsersFacadeService);
  auth = inject(AuthService);
  router = inject(Router);
  dialog = inject(MatDialog);
  breakpointObserver = inject(BreakpointObserver);

  /** Firebase User Object for the current logged in user */
  readonly user = toSignal(this.facade.currentUser(), { initialValue: null });

  /**
   * Sign out the current user and navigate back to the login page.
   */
  async signOut() {
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
  openProfileMenu() {
    const dlgRef = this.dialog.getDialogById('profileMenuDialog');
    if (dlgRef) {
      dlgRef.close();
    } else {
      const isMobile = this.breakpointObserver.isMatched([Breakpoints.Handset]);
      this.dialog.open(DlgProfileMenuComponent, {
        id: 'profileMenuDialog',
        position: isMobile ? undefined : {
          top: "120px",
          right: "16px"
        },
        panelClass: isMobile ? 'mobile-slideup-dialog' : 'no-top-right-radius-dialog',
        enterAnimationDuration: '0ms',
        exitAnimationDuration: '0ms',
      });
    }
  }
}
