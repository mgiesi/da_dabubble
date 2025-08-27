import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Output, EventEmitter } from '@angular/core';

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
  @Output() avatarsLoaded = new EventEmitter<void>();
  avatarIconsArray = [
    {
      src: '/img/avatar/elias-neumann.png',
      alt: 'Profile bild Elias Neumann',
      loaded: false,
    },
    {
      src: '/img/avatar/elise-roth.png',
      alt: 'Profile bild Elise Roth',
      loaded: false,
    },
    {
      src: '/img/avatar/frederik-beck.png',
      alt: 'Profile bild Frederik Beck',
      loaded: false,
    },
    {
      src: '/img/avatar/noah-braun.png',
      alt: 'Profile bild Noah Braun',
      loaded: false,
    },
    {
      src: '/img/avatar/sofia-müller.png',
      alt: 'Profile bild Sofia Müller',
      loaded: false,
    },
    {
      src: '/img/avatar/steffen-hoffmann.png',
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
}
