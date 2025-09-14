import { Component, computed, inject, Input, input, InputSignal } from '@angular/core';
import { User } from '../../../shared/models/user';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../shared/models/channel';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { ImgSrcDirective } from "../../../core/services/img-src-directive";
import { MatDialog } from '@angular/material/dialog';
import { DlgMembersListComponent } from '../dlg-members-list/dlg-members-list.component';

const EMPTY_USERS: User[] = [];

@Component({
  selector: 'app-members-miniatur-info',
  imports: [CommonModule, ImgSrcDirective],
  templateUrl: './members-miniatur-info.component.html',
  styleUrl: './members-miniatur-info.component.scss'
})
export class MembersMiniaturInfoComponent {
  private channelFacade = inject(ChannelsFacadeService);
  dialog = inject(MatDialog);

  // Max number of member avatar fields until a +N field will be shown
  @Input() membersViewLimit = 5;
  // Input variable to link this component with a channel
  channel: InputSignal<Channel | null> = input<Channel | null>(null);

  readonly membersSig = toSignal<User[] | null>(
    toObservable(this.channel).pipe(
      map(ch => ch?.id ?? null),
      distinctUntilChanged(),
      switchMap(id => id ? this.channelFacade.getChannelMembers$(id) : of(null))
    ),
    { initialValue: null }
  );

  // Computes the number of members inside the channel
  readonly membersCount = computed(() => this.membersSig()?.length);
  // Computes the list of members in form of User objects of the channel
  readonly members = computed<User[]>(() => this.membersSig() ?? []);
  // Computes the list of visible members depending on the variable 'membersViewLimit'
  readonly visibleMembers = computed(() => this.membersSig()?.slice(0, this.membersViewLimit) );


  
  openMembersListDialog(triggerEl: HTMLElement) {
    const dialogRef = this.dialog.getDialogById('profileDetailsDialog');
    if (dialogRef) {
      dialogRef.close();
    } else {
      const rect = triggerEl.getBoundingClientRect();
      const top = `${rect.bottom + 8}px`;
      const right = `${window.innerWidth - rect.right}px`
      this.dialog.open(DlgMembersListComponent, {
            id: 'profileDetailsDialog',
            position: {
              top: top,
              right: right,
            },
            panelClass: 'no-top-right-radius-dialog',
            data: this.channel,
          });
    }
  }
}
