import { Component, computed, inject, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { Channel } from '../../../shared/models/channel';
import { NgFor, NgIf } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../../shared/models/user';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { of } from 'rxjs';
import { ProfileBadgeComponent } from "../../profile/profile-badge/profile-badge.component";

@Component({
  selector: 'app-dlg-members-list',
  imports: [MatDialogContent, NgIf, NgFor, ProfileBadgeComponent],
  templateUrl: './dlg-members-list.component.html',
  styleUrl: './dlg-members-list.component.scss'
})
export class DlgMembersListComponent {
  private channelFacade = inject(ChannelsFacadeService);
  private dialogRef = inject(MatDialogRef<DlgMembersListComponent>);
  
  readonly channel = inject<Signal<Channel | null>>(MAT_DIALOG_DATA);

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
    this.dialogRef.close(false);
  }
}
