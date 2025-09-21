import { NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, model, signal, Signal } from '@angular/core';
import { ChannelsFacadeService } from '../../../core/facades/channels-facade.service';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent } from '@angular/material/dialog';
import { FormsModule, FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule} from '@angular/material/chips';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatRadioModule} from '@angular/material/radio';
import { COMMA, ENTER} from '@angular/cdk/keycodes';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../../shared/models/user';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { ImgSrcDirective } from '../../../core/services/img-src-directive';
import { ProfileBadgeComponent } from "../../profile/profile-badge/profile-badge.component";
import { firstValueFrom, take, tap } from 'rxjs';

interface ChannelCreationData {
  channelName: string;
  channelDescr: string;
}

type OptionValue = 1 | 2;

@Component({
  selector: 'app-dlg-assign-members',
  imports: [NgIf, MatDialogContent, MatFormFieldModule, MatChipsModule, MatIconModule, MatAutocompleteModule, FormsModule, ImgSrcDirective, ProfileBadgeComponent, MatRadioModule, ReactiveFormsModule],
  templateUrl: './dlg-assign-members.component.html',
  styleUrl: './dlg-assign-members.component.scss'
})
export class DlgAssignMembersComponent {
  private channelsFacade = inject(ChannelsFacadeService);
  private userFacade = inject(UsersFacadeService);
  private dialogRef = inject(MatDialogRef<DlgAssignMembersComponent>);
  readonly dialogData = inject<ChannelCreationData>(MAT_DIALOG_DATA);
  private formBuilder = inject(FormBuilder);

  form: FormGroup<{
    choice: FormControl<OptionValue>;
  }>;

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly query = model('');

  readonly directorySig = toSignal<User[] | null>(
    this.userFacade.getUsers$(),
    { initialValue: null }
  );

  readonly pendingAdds = signal<User[]>([]);

  readonly filteredUsers = computed<User[]>(() => {
    const q = this.query().trim().toLocaleLowerCase();
    const directory = this.directorySig() ?? [];
    const selectedIds = new Set(this.pendingAdds().map(u => u.id));
    
    const pool = directory.filter(u => !selectedIds.has(u.id));
    if (!q) return pool;
    return pool.filter(u => 
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  isCreating = false

  constructor() {
    this.form = this.formBuilder.group({
      choice: this.formBuilder.control<OptionValue>(1 as OptionValue, { nonNullable: true, validators: [Validators.required]})
    });
  }

  get choiceSelected(): OptionValue {
    return this.form.controls.choice.value;
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (!value) { this.query.set(''); return; }

    let match: User | null = this.filteredUsers()[0];
    if (!match) {
      const directory = this.directorySig() ?? [];
      const val = value.toLocaleLowerCase();
      match = directory.find(u => 
        u.displayName?.toLocaleLowerCase() === val ||
        u.email?.toLowerCase() === val
      ) ?? null;
      if (match && this.pendingAdds().some(u => u.id === match!.id)) {
        match = null;
      }
    }

    if (match) {
      this.pendingAdds.update(arr => 
        arr.some(u => u.id === match!.id) ? arr : [...arr, match!]
      );
    }
    this.query.set('');
    event.chipInput?.clear();
  }

  remove(user: User): void {
    this.pendingAdds.update(arr => arr.filter(u => u.id !== user.id));
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const user = event.option.value as User | null;
    if (user && !this.pendingAdds().some(u => u.id === user.id)) {
      this.pendingAdds.update(arr => [...arr, user]);
    }
    this.query.set('');
    event.option.deselect();
  }

  
  async createChannel() {
    if (this.isCreating) return

    this.isCreating = true
    
    try {
      // Channel über Facade-Service erstellen
      const channelId = await this.channelsFacade.createChannel(
        this.dialogData.channelName.trim(),
        this.dialogData.channelDescr.trim()
      )

      if (channelId) {
        this.assignMembers(channelId)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error)
    } finally {
      this.isCreating = false
    }
  }


  async assignMembers(channelId: string) {
    this.assignYourself(channelId);
    if (this.choiceSelected == 1) {
      const channel = this.channelsFacade.getChannelByName('Dev Channel');
      if (!channel) return;

      const members = await firstValueFrom(this.channelsFacade.getChannelMembers$(channel.id).pipe(take(1)));
      await Promise.all(members.map(m => this.channelsFacade.addMemberToChannel(channelId, m.id)));
    } else {
      this.pendingAdds().map(u => this.channelsFacade.addMemberToChannel(channelId, u.id));
    }
    this.closeDialog();
  }

  async assignYourself(channelId: string) {
    const user = await firstValueFrom(this.userFacade.currentUser());
    if (!user) return;
    this.channelsFacade.addMemberToChannel(channelId, user.id);
  }

  closeDialog() {
    this.dialogRef.close(false);
  }
}
