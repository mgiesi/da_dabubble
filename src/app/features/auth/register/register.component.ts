import { Component, inject } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { UsersService } from '../../../core/repositories/users.service';
import { AuthCardComponent } from '../auth-assets/AuthCard/auth-card.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatProgressBarModule,
    MatCheckboxModule,
    MatIconModule,
    AuthCardComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  animations: [fadeInOut],
})
export class RegisterComponent {
  name: string = '';
  fullName: string = '';
  email: string = '';
  pwd: string = '';
  confirmPwd: string = '';
  errMsg: string = '';
  inProgress = false;
  checked: boolean = false;
  isHovered: boolean = false;
  showPwd: boolean = false;
  showConfirmPwd: boolean = false;
  customMinLengthError: boolean = false;
  emailExists: boolean = false;

  private authService = inject(AuthService);
  private usersService = inject(UsersService);

  validateNameLength() {
    const cleanedName = this.fullName.replace(/\s/g, '');
    this.customMinLengthError = cleanedName.length < 4;
  }

  toggleCheckbox() {
    this.checked = !this.checked;
  }

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }

  async checkEmailExists() {
    if (!this.email || !AuthService.EMAIL_PATTERN.test(this.email)) {
      this.emailExists = false;
      return;
    }
    const existsInAuth = await this.authService.emailExists(this.email);
    const existsInFirestore = await this.usersService.emailExistsInFirestore(
      this.email
    );
    this.emailExists = existsInAuth || existsInFirestore;
  }
}
