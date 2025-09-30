import { Injectable, Injector, effect, Signal, computed, runInInjectionContext } from '@angular/core';
import { UsersFacadeService } from '../facades/users-facade.service';
import { User } from '../../shared/models/user';

@Injectable({ providedIn: 'root' })
export class DmOnlineLoggerService {
  constructor(
    private usersFacade: UsersFacadeService,
    private injector: Injector
  ) {}

  watchDmUsersOnline(usersSig: Signal<User[]>): void {
    usersSig().forEach((user) => {
      if (!user?.id) return;
      
      runInInjectionContext(this.injector, () => {
        const userSig: Signal<User | null> = computed(() => user);
        const isOnlineSig = this.usersFacade.isOnline(userSig, this.injector);
        
        effect(() => {
          if (isOnlineSig()) {
          }
        });
      });
    });
  }
}