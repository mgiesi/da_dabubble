import { Component, computed, effect, inject, input, InputSignal } from '@angular/core';
import { ProfileAvatarComponent } from "../../profile/profile-avatar/profile-avatar.component";
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { User } from '../../../shared/models/user';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { Channel } from '../../../shared/models/channel';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';

const EMPTY_USERS: User[] = [];

@Component({
  selector: 'app-members-miniatur-info',
  imports: [CommonModule],
  templateUrl: './members-miniatur-info.component.html',
  styleUrl: './members-miniatur-info.component.scss'
})
export class MembersMiniaturInfoComponent {
  private channelFacade = inject(ChannelsFacadeService);

  channel: InputSignal<Channel | null> = input<Channel | null>(null);

  readonly membersSig = toSignal<User[] | null>(
    toObservable(this.channel).pipe(
      map(ch => ch?.id ?? null),
      distinctUntilChanged(),
      switchMap(id => id ? this.channelFacade.getChannelMembers$(id) : of(null))
    ),
    { initialValue: null }
  );

  readonly membersCount = computed(() => this.membersSig()?.length);
  readonly members = computed<User[]>(() => this.membersSig() ?? []);
  readonly firstFiveMembers = computed(() => this.membersSig()?.slice(0, 5) );
}
