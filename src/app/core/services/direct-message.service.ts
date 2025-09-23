import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DirectMessageService {
  private dmSelectedSource = new Subject<string>();
  dmSelected$ = this.dmSelectedSource.asObservable();

  selectUser(userId: string) {
    this.dmSelectedSource.next(userId);
  }
}
