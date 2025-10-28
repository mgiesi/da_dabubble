import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { DlgChannelSettingsComponent, ChannelSettingsData } from '../../features/channels/dlg-channel-settings/dlg-channel-settings.component';
import { DlgProfileDetailsComponent } from '../../features/profile/dlg-profile-details/dlg-profile-details.component';

@Injectable({
  providedIn: 'root'
})
export class ChatDialogService {
  private desktopDialog = inject(MatDialog);
  private mobileDialog = inject(MatBottomSheet);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  private mobileDialogRef?: MatBottomSheetRef;

  openChannelSettings(data: ChannelSettingsData, onSaved: () => void) {
    const desktopDialogRef = this.desktopDialog.getDialogById('btnChannelSettingsDialog');
    
    if (desktopDialogRef) {
      desktopDialogRef.close();
      return;
    }
    
    if (this.mobileDialogRef) {
      this.mobileDialogRef.dismiss();
      return;
    }

    const isMobile = this.breakpointObserver.isMatched(['(max-width: 768px)']);
    isMobile ? this.openMobile(data, onSaved) : this.openDesktop(data, onSaved);
  }

  openProfileDetails(userId: string) {
    this.desktopDialog.open(DlgProfileDetailsComponent, {
      data: { userId },
    });
  }

  private openDesktop(data: ChannelSettingsData, onSaved: () => void) {
    const ref = this.desktopDialog.open(DlgChannelSettingsComponent, {
      id: 'btnChannelSettingsDialog',
      data
    });

    const sub = ref.componentInstance.saved.subscribe(onSaved);

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/workspace']).then(() => window.location.reload());
      }
      sub.unsubscribe();
    });
  }

  private openMobile(data: ChannelSettingsData, onSaved: () => void) {
    this.mobileDialogRef = this.mobileDialog.open(DlgChannelSettingsComponent, {
      panelClass: 'full-screen-bottom-sheet',
      data
    });

    this.mobileDialogRef.afterDismissed().subscribe((result?: boolean) => {
      if (result) {
        onSaved();
        this.router.navigate(['/workspace']).then(() => window.location.reload());
      }
      this.mobileDialogRef = undefined;
    });
  }
}