import { Component } from '@angular/core';
import { fadeInOut } from '../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LegalBtnsComponent } from '../auth-assets/legal-btns/legal-btns.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LegalBtnsComponent,
    MatProgressBarModule,
    MatCheckboxModule,
    MatIconModule,
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
  showPwd: boolean = false;
  showConfirmPwd: boolean = false;
  customMinLengthError: boolean = false;

  validateNameLength() {
    const cleanedName = this.fullName.replace(/\s/g, '');
    this.customMinLengthError = cleanedName.length < 4;
  }
}
