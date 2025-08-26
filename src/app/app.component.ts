import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProfileMenuComponent } from './features/profile/profile-menu/profile-menu.component';
import { AuthService } from './core/services/auth.service';
import { SharedFunctionsService } from '../../src/app/core/services/shared-functions.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, ProfileMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DABubble';
  private auth = inject(AuthService);
  private sharedFunctions = inject(SharedFunctionsService);
  isAuthenticated$ = this.auth.isAuthenticated$;
  showAnimation$ = this.sharedFunctions.showAnimation$;
}
