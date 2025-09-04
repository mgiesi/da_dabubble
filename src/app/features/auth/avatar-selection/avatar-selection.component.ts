import {
  Component,
  inject,
  OnInit,
  signal,
  ViewChild,
  NgZone,
} from '@angular/core';
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
import { Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { set } from 'idb-keyval';
import { UserUtilService } from '../../../core/services/user-util.service';

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
  private userUtil = inject(UserUtilService);
  private ngZone = inject(NgZone);
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
    const name = this.registerData.displayName();
    const pwd = this.registerData.pwd();
    const checked = this.registerData.checked();

    if (!mail || !name || !pwd || !checked) {
      this.router.navigate(['/register'], {
        queryParams: { reason: 'missingdata' },
      });
      return;
    }

    this.user.email = mail;
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
      await this.usersService.createUser(
        '',
        this.registerData.email(),
        this.registerData.displayName(),
        this.user.imgUrl
      );

      this.accountCreatedSuccessfully = true;
      setTimeout(() => {
        this.ngZone.run(async () => {
          const userCredential = await this.authService.signUp(
            this.registerData.email(),
            this.registerData.pwd()
          );
          if (
            userCredential &&
            userCredential.user &&
            userCredential.user.uid
          ) {
            await this.userUtil.setUidByEmail(
              this.registerData.email(),
              userCredential.user.uid
            );
          }
          this.accountCreatedSuccessfully = false;
          await this.router.navigate(['/chat']);
        });
      }, 1000);
    } catch (error: any) {
      this.errMsg = error.message;
      this.inProgress = false;
    }
  }
}
