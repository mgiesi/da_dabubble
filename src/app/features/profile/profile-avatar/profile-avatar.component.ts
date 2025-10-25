import {
  Component,
  inject,
  Injector,
  Input,
  input,
  InputSignal,
  ChangeDetectorRef,
  effect
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
  private cdr = inject(ChangeDetectorRef);

  user: InputSignal<User | null> = input<User | null>(null);
  presenceState = this.facade.presenceState(this.user, this.injector);

  @Input() imgSize: number | string = 70;
  @Input() showStatus = true;
  @Input() showAddAvatar = false;

  fallbackUrl: InputSignal<string> = input<string>('img/avatar/unknown-image.png');

  constructor() {
    effect(() => {
      this.presenceState();
      this.cdr.markForCheck();
    });
  }

  isClamp(val: any): val is string {
    return typeof val === 'string' && val.includes('clamp');
  }
}