import { Component, computed, ElementRef, inject, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { Channel } from '../../../shared/models/channel';
import { NgFor, NgIf } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../../shared/models/user';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { of } from 'rxjs';
import { ProfileBadgeComponent } from "../../profile/profile-badge/profile-badge.component";
import { AddMembersData, DlgAddMembersComponent } from '../dlg-add-members/dlg-add-members.component';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

interface MembersDialogData {
  channel: Signal<Channel | null>;
  refElement: HTMLElement | ElementRef<HTMLElement>;
}

@Component({
  selector: 'app-dlg-members-list',
  imports: [MatDialogContent, NgIf, NgFor, ProfileBadgeComponent],
  templateUrl: './dlg-members-list.component.html',
  styleUrl: './dlg-members-list.component.scss'
})
export class DlgMembersListComponent {
  private channelFacade = inject(ChannelsFacadeService);
  dialog = inject(MatDialog);
  parentDesktopDialogRef = inject(MatDialogRef<DlgMembersListComponent>, {
    optional: true,
  });
  parentMobileDialogRef = inject(MatBottomSheetRef<DlgMembersListComponent>, {
    optional: true,
  });
  
  readonly dialogData = inject<MembersDialogData>(MAT_DIALOG_DATA);
  readonly channel = this.dialogData.channel;
  readonly refElement = this.dialogData.refElement instanceof ElementRef 
  ? this.dialogData.refElement.nativeElement : this.dialogData.refElement;

  readonly membersSig = toSignal<User[] | null>(
    toObservable(this.channel).pipe(
      map(ch => ch?.id ?? null),
      distinctUntilChanged(),
      switchMap(id => id ? this.channelFacade.getChannelMembers$(id) : of(null))
    ),
    { initialValue: null }
  );

  // Computes the list of members in form of User objects of the channel
  readonly members = computed<User[]>(() => this.membersSig() ?? []);

  trackById = (_: number, u: User) => u.id;
  
  closeDialog() {
    this.parentDesktopDialogRef?.close(false);
    this.parentMobileDialogRef?.dismiss(false);
  }

  openAddMembersDialog() {
    this.closeDialog();
    const dialogRef = this.dialog.getDialogById('addMemberDialog');
    if (dialogRef) {
      dialogRef.close();
    } else {
      const rect = this.refElement.getBoundingClientRect();
      const top = `${rect.bottom + 8}px`;
      const right = `${window.innerWidth - rect.right}px`
      this.dialog.open(DlgAddMembersComponent, {
        id: 'addMemberDialog',
        position: {
          top: top,
          right: right,
        },
        panelClass: 'no-top-right-radius-dialog',
        data: { channel: this.channel } as AddMembersData,
      });
    }
  }
}
