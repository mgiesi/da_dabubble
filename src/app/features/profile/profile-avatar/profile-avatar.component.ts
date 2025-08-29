import { Component, inject, Injector, Input, input, InputSignal, Signal } from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';

@Component({
  selector: 'app-profile-avatar',
  imports: [CommonModule],
  templateUrl: './profile-avatar.component.html',
  styleUrl: './profile-avatar.component.scss'
})
export class ProfileAvatarComponent {
  private injector = inject(Injector);
  private facade = inject(UsersFacadeService);

  /** Input variable for the Firebase user object which should be used with this component */
  user: InputSignal<User | null> = input<User | null>(null);

  isOnline = this.facade.isOnline(this.user, this.injector);

  @Input() imgSize = 70;
}
