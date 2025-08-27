import { Component, inject } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LegalBtnsComponent } from '../auth-assets/legal-btns/legal-btns.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { AuthCardComponent } from '../auth-assets/AuthCard/auth-card.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatIconModule,
    AuthCardComponent,
    RouterLink,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  animations: [fadeInOut],
})
export class ForgotPasswordComponent {
  resetEmail: string = '';
  emailExists: boolean | null = null;
  emailCheckInProgress = false;
  errMsg: string = '';

  authService = inject(AuthService);
  usersService = inject(UsersService);

  async checkEmailExists() {
    this.emailExists = null;
    this.errMsg = '';
    if (!this.resetEmail || !AuthService.EMAIL_PATTERN.test(this.resetEmail)) {
      return;
    }
    this.emailCheckInProgress = true;
    this.emailExists = await this.authService.emailExists(this.resetEmail);
    if (!this.emailExists) {
      this.errMsg = 'Es existiert kein Benutzer mit dieser E-Mail-Adresse';
    }
    this.emailCheckInProgress = false;
  }
}
