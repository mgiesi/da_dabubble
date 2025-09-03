import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthCardComponent } from '../auth-assets/AuthCard/auth-card.component';
import { ChooseAvatarComponent } from '../auth-assets/choose-avatar/choose-avatar.component';
import { RegisterDataService } from '../../../core/services/register-data.service';
import { User } from '../../../shared/models/user';
import { signOut } from 'firebase/auth';
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';

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
export class AvatarSelectionComponent implements OnInit {
  inProgress: boolean = true;
  accountCreatedSuccessfully: boolean = false;
  private registerData = inject(RegisterDataService);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private router = inject(Router);
  @ViewChild(ChooseAvatarComponent)
  private chooseAvatar?: ChooseAvatarComponent;

  user: User = {
    id: '',
    uid: '',
    displayName: '',
    email: '',
    imgUrl: '',
    createdAt: Timestamp.now(),
  };

  errMsg: string = '';

  ngOnInit(): void {
    const mail = this.registerData.email();

    if (mail) this.user.email = mail;
  }

  onAvatarsLoaded() {
    this.inProgress = false;
  }

  async register() {
    this.inProgress = true;

    if (this.chooseAvatar) {
      const localu = this.chooseAvatar.userLocal();
      if (localu) {
        this.user.imgUrl = localu.imgUrl;
      }
    }

    try {
      const userCredential = await this.authService.signUp(
        this.registerData.email(),
        this.registerData.pwd()
      );
      await this.usersService.createUser(
        userCredential.user.uid,
        this.registerData.email(),
        this.registerData.displayName(),
        this.user.imgUrl
      );
      await this.router.navigate(['/chat']);
    } catch (error: any) {
      this.errMsg = error.message;
    } finally {
      this.inProgress = false;
    }
  }
}
