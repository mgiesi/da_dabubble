import {
  Component,
  inject,
  Injector,
  Input,
  input,
  InputSignal
} from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { ImgSrcDirective } from "../../../core/services/img-src-directive";

@Component({
  selector: 'app-profile-avatar',
  imports: [CommonModule, ImgSrcDirective],
  templateUrl: './profile-avatar.component.html',
  styleUrl: './profile-avatar.component.scss',
})
export class ProfileAvatarComponent {
  private injector = inject(Injector);
  private facade = inject(UsersFacadeService);

  /** Input variable for the Firebase user object which should be used with this component */
  user: InputSignal<User | null> = input<User | null>(null);

  isOnline = this.facade.isOnline(this.user, this.injector);

  @Input() imgSize: number | string = 70;
  isClamp(val: any): val is string {
    return typeof val === 'string' && val.includes('clamp');
  }
  @Input() showStatus = true;
  @Input() showAddAvatar = false;

  fallbackUrl: InputSignal<string> = input<string>(
    'img/avatar/unknown-image.png'
  );
}
