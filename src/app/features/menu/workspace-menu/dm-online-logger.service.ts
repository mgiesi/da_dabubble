import { Injectable, Injector, effect, Signal, computed } from '@angular/core';
import { UsersFacadeService } from '../../../core/facades/users-facade.service';
import { User } from '../../../shared/models/user';

@Injectable({ providedIn: 'root' })
export class DmOnlineLoggerService {
  private lastOnlineUserId: string | null = null;
  private lastOnlineUserName: string | null = null;
  private setOnlineUser: ((name: string) => void) | null = null;

  constructor(
    private usersFacade: UsersFacadeService,
    private injector: Injector
  ) {}

  /**
   * Call this method with the list of DM users to log when one comes online.
   * Optionally provide a callback to set the online user name in the parent component.
   */
  watchDmUsersOnline(
    usersSig: Signal<User[]>,
    setOnlineUser?: (name: string) => void
  ): void {
    this.setOnlineUser = setOnlineUser || null;
    usersSig().forEach((user) => {
      if (!user?.id) return;
      const userSig: Signal<User | null> = computed(() => user);
      const presenceState = this.usersFacade.presenceState(userSig, this.injector);
      effect(() => {
        if (presenceState() === 'online' && this.lastOnlineUserId !== user.id) {
          this.lastOnlineUserId = user.id;
          this.lastOnlineUserName = user.displayName;
          if (this.setOnlineUser) {
            this.setOnlineUser(user.displayName);
          }
          console.log(
            `[DM-Online] User online: ${user.displayName} (${user.id})`
          );
        }
      });
    });
  }
  getLastOnlineUserName(): string | null {
    return this.lastOnlineUserName;
  }
}
