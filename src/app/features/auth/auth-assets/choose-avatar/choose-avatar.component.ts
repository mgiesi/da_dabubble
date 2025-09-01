import { Component, inject, input, InputSignal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ImageStorageService } from '../../../../core/services/image-storage.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  private http = inject(HttpClient);
  private storage = inject(ImageStorageService);

  avatarUrl: string = '';

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
  
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const url = await this.uploadAvatarPhoto(file);
      this.avatarUrl = url;
      
    } catch (err: any) {
      console.log(err);      
    }
  }

  async uploadAvatarPhoto(file: File | Blob): Promise<string> {
    const uuid = crypto.randomUUID();
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
