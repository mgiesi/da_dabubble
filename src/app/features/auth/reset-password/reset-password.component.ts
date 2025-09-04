import { Component, inject, OnInit } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; // Added imports
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { AuthCardComponent } from '../auth-assets/AuthCard/auth-card.component';
import { getAuth, confirmPasswordReset } from 'firebase/auth';
import { CustomPasswordResetService } from './custom-password-reset.service';

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
  newPassword: string = '';
  confirmNewPassword: string = '';
  setNewPasswordInProgress: boolean = false;
  showPwd: boolean = false;
  showConfirmPwd: boolean = false;
  errMsg: string = '';
  infoMsg: string = '';

  // Für Custom Token System
  customToken: string | null = null;
  tokenEmail: string = '';
  tokenValid: boolean = false;
  tokenChecked: boolean = false;

  // Für Firebase oobCode (Fallback)
  oobCode: string | null = null;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customResetService = inject(CustomPasswordResetService);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      // Custom Token System
      this.customToken = params['token'] || null;
      // Firebase oobCode System (Fallback)
      this.oobCode = params['oobCode'] || null;

      if (this.customToken) {
        this.validateCustomToken();
      } else if (this.oobCode) {
        this.infoMsg = 'Firebase Standard Reset-Link erkannt.';
      } else {
        this.errMsg = 'Fehlender oder ungültiger Reset-Link.';
      }
    });
  }

  async validateCustomToken() {
    if (!this.customToken) return;
    try {
      const validation = await this.customResetService.validateResetToken(this.customToken);
      if (validation.valid) {
        this.tokenValid = true;
        this.tokenEmail = validation.email || '';
        this.infoMsg = `✅ Reset-Link gültig für: ${this.tokenEmail}`;
      } else {
        this.tokenValid = false;
        this.errMsg = validation.error || 'Ungültiger Reset-Link';
      }
    } catch (error) {
      this.tokenValid = false;
      this.errMsg = 'Fehler bei der Validierung des Reset-Links.';
    }
    this.tokenChecked = true;
  }

  async onSubmit() {
    this.errMsg = '';
    this.infoMsg = '';

    // Passwort Validierung
    if (!this.newPassword || !this.confirmNewPassword) {
      this.errMsg = 'Bitte füllen Sie alle Felder aus.';
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.errMsg = 'Die Passwörter stimmen nicht überein.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.errMsg = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
      return;
    }
    // Zusätzliche Passwort-Validierung
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(this.newPassword)) {
      this.errMsg = 'Das Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten.';
      return;
    }

    this.setNewPasswordInProgress = true;

    try {
      if (this.customToken) {
        // Custom Token System verwenden
        await this.resetWithCustomToken();
      } else if (this.oobCode) {
        // Firebase Standard System verwenden
        await this.resetWithFirebaseCode();
      } else {
        throw new Error('Kein gültiger Reset-Code verfügbar.');
      }
    } catch (error: any) {
      this.handleError(error.code || error.message);
    }

    this.setNewPasswordInProgress = false;
  }

  private async resetWithCustomToken() {
    if (!this.customToken) {
      throw new Error('Kein Custom Token verfügbar.');
    }
    const result = await this.customResetService.resetPasswordWithToken(
      this.customToken, 
      this.newPassword
    );
    if (result.success) {
      this.infoMsg = '✅ Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt mit dem neuen Passwort anmelden.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2500);
    } else {
      this.errMsg = result.error || 'Fehler beim Zurücksetzen des Passworts.';
    }
  }

  private async resetWithFirebaseCode() {
    if (!this.oobCode) {
      this.errMsg = 'Interner Fehler: Code zum Zurücksetzen fehlt.';
      return;
    }
    const auth = getAuth();
    try {
      await confirmPasswordReset(auth, this.oobCode, this.newPassword);
      this.infoMsg = '✅ Ihr Passwort wurde erfolgreich zurückgesetzt! Sie können sich jetzt anmelden.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2500);
    } catch (error: any) {
      this.handleError(error.code);
    }
  }

  private handleError(errorCode: string): void {
    switch (errorCode) {
      case 'auth/invalid-action-code':
      case 'Ungültiger oder abgelaufener Link':
        this.errMsg = 'Der Link ist ungültig oder abgelaufen.';
        break;
      case 'auth/user-disabled':
        this.errMsg = 'Der Benutzeraccount wurde deaktiviert.';
        break;
      case 'auth/weak-password':
      case 'Passwort muss mindestens 8 Zeichen lang sein':
      case 'Passwort muss mindestens einen Kleinbuchstaben enthalten':
      case 'Passwort muss mindestens einen Großbuchstaben enthalten':
      case 'Passwort muss mindestens eine Zahl enthalten':
        this.errMsg = errorCode;
        break;
      default:
        this.errMsg = 'Ein unerwarteter Fehler ist aufgetreten: ' + errorCode;
    }
  }
}
