import {
  Component,
  inject,
  input,
  InputSignal,
  Output,
  EventEmitter,
  Input,
  computed,
} from '@angular/core';
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { MatDialog } from '@angular/material/dialog';
import { DlgProfileDetailsComponent } from '../dlg-profile-details/dlg-profile-details.component';
import { UnreadIndicatorComponent } from '../../../shared/unread-indicator/unread-indicator.component';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-profile-badge',
  imports: [CommonModule, ProfileAvatarComponent, UnreadIndicatorComponent],
  templateUrl: './profile-badge.component.html',
  styleUrl: './profile-badge.component.scss',
})
export class ProfileBadgeComponent {
  facade = inject(UsersFacadeService);
  dialog = inject(MatDialog);
  notificationService = inject(NotificationService);

  @Output() userClicked = new EventEmitter<string>();

  @Input() openProfileDetailsOnClick = true;
  @Input() active = false;

  user: InputSignal<User | null> = input<User | null>(null);
  readonly isSelf = this.facade.isCurrentUser(this.user);

unreadCount = computed(() => {
  const userId = this.user()?.id;
  const count = userId ? this.notificationService.getUnreadCount(userId) : 0;
  return count;
});

  openProfileDetails() {
    this.dialog.open(DlgProfileDetailsComponent, {
      data: { userId: this.user()?.id },
    });
  }

  onUserClick() {
    const currentUser = this.user();
    if (!currentUser?.id) return;

    // Unread löschen beim Öffnen
    this.notificationService.clearUnread(currentUser.id);

    if (this.userClicked.observed) {
      this.userClicked.emit(currentUser.id);
    } else if (this.openProfileDetailsOnClick) {
      this.openProfileDetails();
    }
  }
}