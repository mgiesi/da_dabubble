import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatNavigationService {
  private dmSelectedSource = new Subject<string>();
  dmSelected$ = this.dmSelectedSource.asObservable();

  private channelSelectedSource = new Subject<string>();
  channelSelected$ = this.channelSelectedSource.asObservable();

  selectUser(userId: string) {
    this.dmSelectedSource.next(userId);
  }

  selectChannel(channelId: string) {
    this.channelSelectedSource.next(channelId);
  }
}
