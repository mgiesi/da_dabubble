import { Component } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthCardComponent } from '../auth-assets/AuthCard/auth-card.component';
import { ChooseAvatarComponent } from '../auth-assets/choose-avatar/choose-avatar.component';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatIconModule,
    AuthCardComponent,
    RouterLink,
    ChooseAvatarComponent,
  ],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
  animations: [fadeInOut],
})
export class AvatarSelectionComponent {
  avatarSectionInProgress: boolean = true;
  accountCreatedSuccessfully: boolean = false;

  onAvatarsLoaded() {
    this.avatarSectionInProgress = false;
  }
}
