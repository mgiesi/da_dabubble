import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { firstValueFrom, filter, take } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialogContent } from '@angular/material/dialog';

@Component({
  selector: 'app-dlg-profile-menu',
  imports: [MatDialogContent],
  templateUrl: './dlg-profile-menu.component.html',
  styleUrl: './dlg-profile-menu.component.scss'
})
export class DlgProfileMenuComponent {
  auth = inject(AuthService);
  router = inject(Router); 

  /**
   * Sign out the current user and navigate back to the login page.
   */
  async signOut() {
    await this.auth.signOut();
    await firstValueFrom(this.auth.user$.pipe(
      filter(u => !u),
      take(1)
    ));
    await this.router.navigate(['/login']);
  }
}
