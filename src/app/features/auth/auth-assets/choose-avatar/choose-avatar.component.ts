import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  EnvironmentInjector,
  inject,
  input,
  InputSignal,
  runInInjectionContext,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ImageStorageService } from '../../../../core/services/image-storage.service';
import { ProfileAvatarComponent } from '../../../profile/profile-avatar/profile-avatar.component';
import { User } from '../../../../shared/models/user';
import { Timestamp } from '@angular/fire/firestore';
import { MatTooltipModule } from '@angular/material/tooltip';

const defaultUser: User = {
  id: '',
  uid: '',
  displayName: '',
  email: '',
  imgUrl: '',
  createdAt: Timestamp.now(),
};

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatIconModule,
    ProfileAvatarComponent,
    NgIf,
    MatTooltipModule,
  ],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  private http = inject(HttpClient);
  private storage = inject(ImageStorageService);
  private env = inject(EnvironmentInjector);

  /** Input variable to set a user reference object */
  user = input<User | null>(defaultUser);
  /** Local user object as signal, to link it with the avatar component. */
  userLocal = signal<User | null>(this.user());

  constructor() {
    afterNextRender(() => {
      runInInjectionContext(this.env, () => {
        effect(() => {
          const u = this.user();
          this.userLocal.set(u);
        });
      });
    });
  }

  // Kamera-Blitz Effekt auf dem Button
  flashCameraIcon(event: MouseEvent) {
    const btn = event.currentTarget as HTMLElement;
    btn.classList.add('flash');
    setTimeout(() => {
      btn.classList.remove('flash');
    }, 300);
  }

  @Output() avatarsLoaded = new EventEmitter<void>();
  avatarIconsArray = [
    {
      src: 'img/avatar/elias-neumann.png',
      alt: 'Profile bild Elias Neumann',
      loaded: false,
    },
    {
      src: 'img/avatar/elise-roth.png',
      alt: 'Profile bild Elise Roth',
      loaded: false,
    },
    {
      src: 'img/avatar/frederik-beck.png',
      alt: 'Profile bild Frederik Beck',
      loaded: false,
    },
    {
      src: 'img/avatar/noah-braun.png',
      alt: 'Profile bild Noah Braun',
      loaded: false,
    },
    {
      src: 'img/avatar/sofia-müller.png',
      alt: 'Profile bild Sofia Müller',
      loaded: false,
    },
    {
      src: 'img/avatar/steffen-hoffmann.png',
      alt: 'Profile bild Steffen Hoffmann',
      loaded: false,
    },
  ];

  onAvatarLoad(avatar: any) {
    avatar.loaded = true;
    if (this.avatarIconsArray.every((a) => a.loaded)) {
      this.avatarsLoaded.emit();
    }
  }

  /**
   * Writes the given url to the local user object.
   * Url can be a link to a default avatar icon or a link to the
   * uploaded file.
   *
   * @param url url for the avatar image
   */
  selectAvatar(url: string) {
    this.userLocal.update((u) => {
      if (!u) return null;
      return { ...u, imgUrl: url };
    });
  }

  /**
   * This method gets called when pressing the avatar image, to upload
   * a new image.
   * The function will try to do a upload by PHP script. If this fails,
   * the image will be stored in the internal IndexedDB as blob.
   *
   * @param event event
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const url = await this.uploadAvatarPhoto(file);
      this.selectAvatar(url);
    } catch (err: any) {
      console.log(err);
    }
  }

  /**
   * Uploads a file to the webspace (PHP) or IndexedDB.
   *
   * @param file file or blob data
   * @returns url to the uploaded file
   */
  private async uploadAvatarPhoto(file: File | Blob): Promise<string> {
    const uuid = this.userLocal()?.email;
    const ext = this.guessExt(file);
    const filename = `${uuid}.${ext}`;

    const formData = new FormData();
    formData.append('file', file, filename);

    try {
      const res: any = await firstValueFrom(
        this.http.post('upload.php', formData)
      );

      if (res?.url) {
        return res.url;
      }
      throw new Error('No URL in response');
    } catch (error: any) {
      const key = `avatar-${uuid}`;
      await this.storage.saveAvatarImage(key, file);
      return `idb:${key}`;
    }
  }

  /**
   * Determine the extension of a file or blob element.
   *
   * @param blob file or blob data
   * @returns file extension to use
   */
  private guessExt(blob: File | Blob): string {
    if (typeof (blob as File).name === 'string') {
      const name = (blob as File).name;
      const m = name.match(/\.([a-zA-Z0-9]{1,8})$/);
      if (m) return m[1].toLowerCase();
    }
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif',
      'image/svg+xml': 'svg',
    };
    if (blob.type && map[blob.type]) return map[blob.type];
    return 'bin';
  }
}
