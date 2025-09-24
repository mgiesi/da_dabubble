import { Injectable, Injector, effect, Signal, computed } from '@angular/core';
import { UsersFacadeService } from '../facades/users-facade.service';
import { User } from '../../shared/models/user';

@Injectable({ providedIn: 'root' })
export class DmOnlineLoggerService {
  constructor(
    private usersFacade: UsersFacadeService,
    private injector: Injector
  ) {}

  /**
   * Call this method with the list of DM users to log when one comes online.
   */
  watchDmUsersOnline(usersSig: Signal<User[]>): void {
    usersSig().forEach((user) => {
      if (!user?.id) return;
      // Create a signal for this user
      const userSig: Signal<User | null> = computed(() => user);
      const isOnlineSig = this.usersFacade.isOnline(userSig, this.injector);
      effect(() => {
        if (isOnlineSig()) {
          console.log(
            `[DM-Online] User online: ${user.displayName} (${user.id})`
          );
        }
      });
    });
  }
}
