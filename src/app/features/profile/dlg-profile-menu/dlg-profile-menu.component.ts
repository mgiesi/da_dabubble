import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom, filter, take } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import {
  MatDialog,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { DlgProfileDetailsComponent } from '../dlg-profile-details/dlg-profile-details.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { animate, style, transition, trigger } from '@angular/animations';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-dlg-profile-menu',
  imports: [MatDialogContent, RouterLink],
  templateUrl: './dlg-profile-menu.component.html',
  styleUrl: './dlg-profile-menu.component.scss',
})
export class DlgProfileMenuComponent {
  touchStartY: number | null = null;
  isDragging = false;
  auth = inject(AuthService);
  facade = inject(UsersFacadeService);
  router = inject(Router);
  breakpointObserver = inject(BreakpointObserver);
  dialog = inject(MatDialog);
  parentDesktopDialogRef = inject(MatDialogRef<DlgProfileMenuComponent>, {
    optional: true,
  });
  parentMobileDialogRef = inject(MatBottomSheetRef<DlgProfileMenuComponent>, {
    optional: true,
  });

  readonly currentUserSig = toSignal(this.facade.currentUser(), {
    initialValue: null,
  });

  /**
   * Sign out the current user and navigate back to the login page.
   */
  async signOut() {
    this.parentDesktopDialogRef?.close(false);
    this.parentMobileDialogRef?.dismiss(false);
    this.facade.signOut();
    await firstValueFrom(
      this.auth.user$.pipe(
        filter((u) => !u),
        take(1)
      )
    );
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 300);
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartY = event.touches[0].clientY;
      this.isDragging = true;
    }
  }

  onTouchMove(event: TouchEvent) {
    if (this.isDragging) {
      event.preventDefault(); // Verhindert Pull-to-Refresh
      // Optional: Drag-Logik hier
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.touchStartY !== null && event.changedTouches.length === 1) {
      const touchEndY = event.changedTouches[0].clientY;
      const deltaY = touchEndY - this.touchStartY;
      if (deltaY > 60) {
        this.closeDialog();
      }
    }
    this.touchStartY = null;
    this.isDragging = false;
  }

  /**
   * Opens the profile details overlay.
   */
  openProfileDetails() {
    this.closeDialog();
    const dialogRef = this.dialog.getDialogById('profileDetailsDialog');
    if (dialogRef) {
      dialogRef.close();
    } else {
      const isMobile = this.breakpointObserver.isMatched([
        '(max-width: 768px)',
      ]);
      if (isMobile) {
        this.openMobileDialog();
      } else {
        this.openDesktopDialog();
      }
    }
  }

  openDesktopDialog() {
    this.dialog.open(DlgProfileDetailsComponent, {
      id: 'profileDetailsDialog',
      position: {
        top: '120px',
        right: '16px',
      },
      panelClass: 'no-top-right-radius-dialog',
      data: this.currentUserSig,
    });
  }

  openMobileDialog() {
    this.dialog.open(DlgProfileDetailsComponent, {
      id: 'profileDetailsDialog',
      data: this.currentUserSig,
    });
  }

  /**
   * Close the open menu dialog.
   */
  closeDialog() {
    this.parentDesktopDialogRef?.close(false);
    this.parentMobileDialogRef?.dismiss(false);
  }
}
