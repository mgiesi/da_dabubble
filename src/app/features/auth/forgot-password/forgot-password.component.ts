import { Component, inject, ViewChild } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  infoMsg: string = '';
  sending: boolean = false;
  resetPasswordEmailSuccessfully: boolean = true;

  @ViewChild('f') form!: NgForm;

  authService = inject(AuthService);
  usersService = inject(UsersService);

  async checkEmailExists() {
    this.emailCheckInProgress = true;
    this.emailExists = null;
    if (!this.resetEmail || !AuthService.EMAIL_PATTERN.test(this.resetEmail)) {
      this.emailExists = null;
      this.emailCheckInProgress = false;
      return;
    }
    try {
      this.emailExists = await this.usersService.emailExistsInFirestore(
        this.resetEmail
      );
    } catch {
      this.emailExists = null;
    }
    this.emailCheckInProgress = false;
  }

  async onSubmit() {
    this.resetEmail = this.resetEmail.trim().toLowerCase();
    this.clearMessages();
    if (!this.isEmailValid()) return;
    await this.checkEmailExistsAndSetFlag();
    if (this.emailExists === false) return;

    try {
      await this.authService.sendPasswordResetEmail(this.resetEmail);
      if (this.form) {
        this.form.resetForm();
      }
    } catch (error: any) {
      this.errMsg = error?.message || 'Fehler beim Senden der E-Mail.';
    }
  }

  clearMessages() {
    this.errMsg = '';
    this.infoMsg = '';
  }

  isEmailValid(): boolean {
    return !!this.resetEmail && AuthService.EMAIL_PATTERN.test(this.resetEmail);
  }

  async checkEmailExistsAndSetFlag() {
    this.emailCheckInProgress = true;
    try {
      this.emailExists = await this.usersService.emailExistsInFirestore(
        this.resetEmail
      );
    } catch {
      this.emailExists = null;
    }
    this.emailCheckInProgress = false;
  }
}
