import { Component, inject, input, InputSignal, Output, EventEmitter } from '@angular/core';
import { ProfileAvatarComponent } from "../profile-avatar/profile-avatar.component";
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DlgProfileDetailsComponent } from '../dlg-profile-details/dlg-profile-details.component';

@Component({
  selector: 'app-profile-badge',
  imports: [CommonModule, ProfileAvatarComponent],
  templateUrl: './profile-badge.component.html',
  styleUrl: './profile-badge.component.scss'
})
export class ProfileBadgeComponent {
  facade = inject(UsersFacadeService);
  dialog = inject(MatDialog);

  @Output() userClicked = new EventEmitter<string>();

  /** Input variable for the Firebase user object which should be used with this component */
  user: InputSignal<User | null> = input<User | null>(null);
  /** Helper variable (signal) to check if linked user is current user */
  readonly isSelf = this.facade.isCurrentUser(this.user);

  /**
   * Opens the profile info overlay.
   */
  openProfileDetails() {
    this.dialog.open(DlgProfileDetailsComponent, {
      data: this.user
    });
  }

  /**
 * Handle user click - emit userId for DM or open profile
 */
  onUserClick() {
    const currentUser = this.user();
    if (!currentUser?.id) return;

    if (this.userClicked.observed) {
      this.userClicked.emit(currentUser.id);
    } else {
      this.openProfileDetails();
    }
  }
}
