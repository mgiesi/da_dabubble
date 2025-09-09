import {
  Component,
  inject,
  OnInit,
  ViewChild,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
import { RegisterDataService } from '../../../core/services/register-data.service';

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
export class RegisterComponent implements OnInit {
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

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private env = inject(EnvironmentInjector);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  infoMsg: string = '13131351';
  registerData = inject(RegisterDataService);

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const name = this.registerData.displayName();
    const mail = this.registerData.email();
    const pw = this.registerData.pwd();

    if (name) this.fullName = name;
    if (mail) this.email = mail;
    if (pw) this.pwd = pw;
    if (pw) this.confirmPwd = pw;

    this.route.queryParams.subscribe((params) => {
      if (params['reason'] === 'missingdata') {
        this.infoMsg = '*Bitte gib zuerst deine Registrierungsdaten ein.';
        // setTimeout(() => {
        //   this.infoMsg = '';
        // }, 8000);
      }
    });
  }

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

  async nextStep(form: NgForm) {
    this.formSubmitted = true;
    if (!this.isFormValid()) return;
    this.inProgress = true;
    try {
      await this.checkIfEmailExists();
      if (this.emailExists) return;
      this.saveRegisterData();
      await this.router.navigate(['/avatar-selection']);
    } finally {
      this.inProgress = false;
    }
  }

  isFormValid(): boolean {
    return !!(this.form && this.form.valid);
  }

  async checkIfEmailExists() {
    const existsInAuth = await this.authService.emailExists(this.email);
    const existsInFirestore = await runInInjectionContext(this.env, () =>
      this.usersService.emailExistsInFirestore(this.email)
    );
    this.emailExists = existsInAuth || existsInFirestore;
  }

  saveRegisterData() {
    this.registerData.displayName.set(this.fullName);
    this.registerData.email.set(this.email);
    this.registerData.pwd.set(this.pwd);
    this.registerData.checked.set(this.checked);
  }
}
