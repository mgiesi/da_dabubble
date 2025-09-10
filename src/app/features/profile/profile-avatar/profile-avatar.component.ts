import {
  Component,
  effect,
  inject,
  Injector,
  Input,
  input,
  InputSignal,
  OnDestroy,
  signal,
  Signal,
} from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { CommonModule } from '@angular/common';
import { User } from '../../../shared/models/user';
import { ImageStorageService } from '../../../core/services/image-storage.service';

@Component({
  selector: 'app-profile-avatar',
  imports: [CommonModule],
  templateUrl: './profile-avatar.component.html',
  styleUrl: './profile-avatar.component.scss',
})
export class ProfileAvatarComponent implements OnDestroy {
  private injector = inject(Injector);
  private facade = inject(UsersFacadeService);
  private imgStorage = inject(ImageStorageService);

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
  imgSrc = signal<string>(this.fallbackUrl());

  private revokeFn?: () => void;
  private requestSeq = 0;

  constructor() {
    effect(() => {
      const u = this.user();
      const fallback = this.fallbackUrl();
      const imgUrl = u?.imgUrl ?? null;
      this._load(imgUrl, fallback);
    });
  }

  private async _load(imgUrl: string | null, fallback: string) {
    const myId = ++this.requestSeq;

    if (this.revokeFn) {
      this.revokeFn();
      this.revokeFn = undefined;
    }

    this.imgSrc.set(fallback);

    const { src, revoke } = await this.imgStorage.resolveImgSrc(
      imgUrl ?? '',
      this.fallbackUrl()
    );

    if (myId !== this.requestSeq) {
      if (revoke) {
        revoke();
      }
      return;
    }

    this.imgSrc.set(src || this.fallbackUrl());
    this.revokeFn = revoke;
  }

  onImgError() {
    if (this.revokeFn) {
      this.revokeFn();
      this.revokeFn = undefined;
    }
    this.imgSrc.set(this.fallbackUrl());
  }

  ngOnDestroy(): void {
    if (this.revokeFn) {
      this.revokeFn();
    }
  }
}
