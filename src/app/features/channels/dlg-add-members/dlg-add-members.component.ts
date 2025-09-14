import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, model, signal, Signal } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { Channel } from '../../../shared/models/channel';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import {MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import {MatFormFieldModule} from '@angular/material/form-field';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../../shared/models/user';
import { distinctUntilChanged, forkJoin, map, of, switchMap, take } from 'rxjs';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';

@Component({
  selector: 'app-dlg-add-members',
  imports: [NgIf, MatDialogContent, MatFormFieldModule, MatChipsModule, MatIconModule, MatAutocompleteModule, FormsModule],
  templateUrl: './dlg-add-members.component.html',
  styleUrl: './dlg-add-members.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlgAddMembersComponent {
  private channelFacade = inject(ChannelsFacadeService);
  private userFacade = inject(UsersFacadeService);
  private dialogRef = inject(MatDialogRef<DlgAddMembersComponent>);
  
  readonly channel = inject<Signal<Channel | null>>(MAT_DIALOG_DATA);

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly query = model('');

  readonly membersSig = toSignal<User[] | null>(
    toObservable(this.channel).pipe(
      map(ch => ch?.id ?? null),
      distinctUntilChanged(),
      switchMap(id => id ? this.channelFacade.getChannelMembers$(id) : of(null))
    ),
    { initialValue: null }
  );
  readonly members = computed<User[]>(() => this.membersSig() ?? []);

  readonly directorySig = toSignal<User[] | null>(
    this.userFacade.getUsers$(),
    { initialValue: null }
  );

  readonly pendingAdds = signal<User[]>([]);
  readonly pendingRemovals = signal<Set<string>>(new Set());

  readonly visibleMembers = computed<User[]>(() => {
    const removed = this.pendingRemovals();
    const base = this.members().filter(u => !removed.has(u.id));
    return [...base, ...this.pendingAdds()];
  });

  readonly nonMembers = computed<User[]>(() => {
    const visibleIds = new Set(this.visibleMembers().map(u => u.id));
    const dir = this.directorySig() ?? [];
    return dir.filter(u => !visibleIds.has(u.id));
  });

  readonly filteredUsers = computed<User[]>(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const pool = this.nonMembers();
    if (!q) return pool;
    return pool.filter(u => 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  readonly announcer = inject(LiveAnnouncer);

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) { this.query.set(''); return; }

    const match = 
      this.filteredUsers()[0] ??
      this.nonMembers().find(u => 
        u.displayName?.toLocaleLowerCase() === value.toLocaleLowerCase() ||
        u.email?.toLocaleLowerCase() === value.toLocaleLowerCase()
      );

    if (match) {
      const exists = this.pendingAdds().some(u => u.id === match.id);
      if (!exists) this.pendingAdds.update(arr => [...arr, match]);
    }
    this.query.set('');
  }

  remove(user: User): void {
    if (this.pendingAdds().some(u => u.id === user.id)) {
      this.pendingAdds.update(arr => arr.filter(u => u.id !== user.id));
      return;
    }

    if (!this.pendingRemovals().has(user.id)) {
      const next = new Set(this.pendingRemovals());
      next.add(user.id);
      this.pendingRemovals.set(next);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const user = event.option.value as User | null;
    if (user && !this.pendingAdds().some(u => u.id === user.id)) {
      this.pendingAdds.update(arr => [...arr, user]);
    }
    this.query.set('');
    event.option.deselect();
  }

  addMembers() {
    const ch = this.channel();
    if (!ch?.id) return;

    const adds = this.pendingAdds();
    const removals = Array.from(this.pendingRemovals());

    forkJoin([
      ...adds.map(u => this.channelFacade.addMemberToChannel(ch.id, u.id)),
      ...removals.map(id => this.channelFacade.removeMemberFromChannel(ch.id, id)),
    ])
    .pipe(take(1))
    .subscribe({
      next: () => {
        this.pendingAdds.set([]);
        this.pendingRemovals.set(new Set());
      },
      error: () => {

      }
    });

    this.closeDialog();
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
