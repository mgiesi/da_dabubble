import { Component, inject, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
  @ViewChild('f') form!: NgForm;

  fullName: string = '';
  email: string = '';
  pwd: string = '';
  confirmPwd: string = '';

  formSubmitted: boolean = false;
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
  private router = inject(Router);

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

  async register() {
    this.formSubmitted = true;

    if (this.form.valid && this.checked && !this.emailExists) {
      this.inProgress = true;
      try {
        const userCredential = await this.authService.signUp(
          this.email,
          this.pwd
        );
        await this.usersService.createUser(
          userCredential.user.uid,
          this.email,
          this.fullName,
          '' // imgUrl kann später gesetzt werden
        );
        await this.router.navigate(['/chat']);
      } catch (error: any) {
        this.errMsg = error.message;
      } finally {
        this.inProgress = false;
      }
    }
  }
}
