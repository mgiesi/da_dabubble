import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LegalBtnsComponent } from '../legal-btns/legal-btns.component';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatProgressBarModule,
    LegalBtnsComponent,
  ],
  templateUrl: './auth-card.component.html',
  styleUrl: './auth-card.component.scss',
})
export class AuthCardComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    setTimeout(() => window.scrollTo(0, 0), 100);
  }
}
