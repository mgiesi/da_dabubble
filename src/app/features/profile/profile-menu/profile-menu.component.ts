import { Component, inject } from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';
import { DlgProfileMenuComponent } from '../dlg-profile-menu/dlg-profile-menu.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-profile-menu',
  imports: [CommonModule, ProfileAvatarComponent, MatBottomSheetModule],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss',
})
export class ProfileMenuComponent {
  facade = inject(UsersFacadeService);
  auth = inject(AuthService);
  router = inject(Router);
  breakpointObserver = inject(BreakpointObserver);
  desktopDialog = inject(MatDialog);
  mobileDialog = inject(MatBottomSheet);
  mobileDialogRef: MatBottomSheetRef | undefined = undefined;

  /** Firebase User Object for the current logged in user */
  readonly user = toSignal(this.facade.currentUser(), { initialValue: null });

  /**
   * Sign out the current user and navigate back to the login page.
   */
  async signOut() {
    this.facade.signOut();
    await firstValueFrom(
      this.auth.user$.pipe(
        filter((u) => !u),
        take(1)
      )
    );
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 100);
  }

  /**
   * Opens the profile menu overlay.
   */
  openProfileMenu() {
    const desktopDialogRef =
      this.desktopDialog.getDialogById('profileMenuDialog');
    if (desktopDialogRef) {
      desktopDialogRef.close();
    } else if (this.mobileDialogRef) {
      this.mobileDialogRef.dismiss();
    } else {
      const isMobile = this.breakpointObserver.isMatched([
        '(max-width: 768px)',
      ]);
      if (isMobile) {
        this.openMobileMenu();
      } else {
        this.openDesktopMenu();
      }
    }
  }

  openMobileMenu() {
    this.mobileDialogRef = this.mobileDialog.open(DlgProfileMenuComponent, {
      panelClass: 'empty-dialog',
    });
    this.mobileDialogRef.afterDismissed().subscribe(() => {
      this.mobileDialogRef = undefined;
    });
  }

  openDesktopMenu() {
    this.desktopDialog.open(DlgProfileMenuComponent, {
      id: 'profileMenuDialog',
      position: {
        top: '120px',
        right: '16px',
      },
      panelClass: 'no-top-right-radius-dialog',
    });
  }
}
