import { Component, inject, input, InputSignal } from '@angular/core';
import { ProfileAvatarComponent } from "../profile-avatar/profile-avatar.component";
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-profile-badge',
  imports: [CommonModule, ProfileAvatarComponent],
  templateUrl: './profile-badge.component.html',
  styleUrl: './profile-badge.component.scss'
})
export class ProfileBadgeComponent {
  facade = inject(UsersFacadeService);
  
  /** Input variable for the Firebase user object which should be used with this component */
  user: InputSignal<User | null> = input<User | null>(null);
  /** Helper variable (signal) to check if linked user is current user */
  readonly isSelf = this.facade.isCurrentUser(this.user);
}
