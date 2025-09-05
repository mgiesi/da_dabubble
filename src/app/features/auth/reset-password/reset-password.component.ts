import { Component, inject, OnInit } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { AuthCardComponent } from '../auth-assets/AuthCard/auth-card.component';
import { confirmPasswordReset } from 'firebase/auth';

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  animations: [fadeInOut],
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  newPassword: string = '';
  confirmNewPassword: string = '';
  setNewPasswordInProgress: boolean = false;
  showPwd: boolean = false;
  showConfirmPwd: boolean = false;
  errMsg: string = '';
  infoMsg: string = '';
  oobCode: string | null = null;
  passwordResetSuccessful: boolean = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'] || null;
      if (!this.oobCode) {
        this.errMsg =
          '*Fehlender oder ungültiger Code zum Zurücksetzen des Passworts.';
        setTimeout(() => {
          this.errMsg = '';
        }, 8000);
      }
    });
  }

  async onSubmit(form: any, pwdField: any, confirmPwdInput: any) {
    this.errMsg = '';
    if (this.isFormInvalid(form, pwdField, confirmPwdInput)) return;
    if (this.isOobCodeMissing()) return;
    await this.tryPasswordReset();
  }

  private isFormInvalid(
    form: any,
    pwdField: any,
    confirmPwdInput: any
  ): boolean {
    if (form.invalid || this.newPassword !== this.confirmNewPassword) {
      this.markFieldsAsTouched(pwdField, confirmPwdInput, form);
      return true;
    }
    return false;
  }

  private markFieldsAsTouched(
    pwdField: any,
    confirmPwdInput: any,
    form: any
  ): void {
    if (pwdField && pwdField.control) pwdField.control.markAsTouched();
    if (confirmPwdInput && confirmPwdInput.control)
      confirmPwdInput.control.markAsTouched();
    form.form.markAsSubmitted && form.form.markAsSubmitted();
  }

  private isOobCodeMissing(): boolean {
    if (!this.oobCode) {
      this.errMsg = 'Interner Fehler: Code zum Zurücksetzen fehlt.';
      return true;
    }
    return false;
  }

  private async tryPasswordReset() {
    this.setNewPasswordInProgress = true;
    const auth = this.authService.firebaseAuth;
    const timeoutPromise = this.createTimeoutPromise();
    try {
      await Promise.race([
        confirmPasswordReset(auth, this.oobCode!, this.newPassword),
        timeoutPromise,
      ]);
      this.setNewPasswordInProgress = false;
      this.passwordResetSuccessful = true;
    } catch (error: any) {
      this.setNewPasswordInProgress = false;
      this.handleError(error.code || error.message);
    }
  }

  private createTimeoutPromise(): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error('Timeout beim Zurücksetzen des Passworts')),
        15000
      )
    );
  }

  private handleError(errorCode: string): void {
    switch (errorCode) {
      case 'auth/invalid-action-code':
        this.errMsg = 'Der Link ist ungültig oder abgelaufen.';
        break;
      case 'auth/user-disabled':
        this.errMsg = 'Der Benutzeraccount wurde deaktiviert.';
        break;
      case 'auth/weak-password':
        this.errMsg = 'Das neue Passwort ist zu schwach.';
        break;
      default:
        this.errMsg = 'Ein unerwarteter Fehler ist aufgetreten: ' + errorCode;
    }
  }
}
