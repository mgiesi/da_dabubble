import { Component, inject } from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { filter, firstValueFrom, take } from 'rxjs';

@Component({
  selector: 'app-profile-menu',
  imports: [CommonModule],
  templateUrl: './profile-menu.component.html',
  styleUrl: './profile-menu.component.scss'
})
export class ProfileMenuComponent {
  facade = inject(UsersFacadeService);
  auth = inject(AuthService);
  router = inject(Router);

  readonly user = toSignal(this.facade.currentUser(), { initialValue: null });

  async signOut() {
    await this.auth.signOut();
    await firstValueFrom(this.auth.user$.pipe(
      filter(u => !u),
      take(1)
    ));
    await this.router.navigate(['/login']);
  }
}
