import { Component, inject } from '@angular/core';
import { fadeInOut } from '../../../../core/animations/fade-in-out.animation';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { UsersService } from '../../../../core/repositories/users.service';
import { Router, RouterLink } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';
import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { LegalBtnsComponent } from '../../auth-assets/legal-btns/legal-btns.component';

@Component({
  selector: 'app-register-container',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressBarModule],
  templateUrl: './register-container.component.html',
  styleUrl: './register-container.component.scss',
})
export class RegisterContainerComponent {}
