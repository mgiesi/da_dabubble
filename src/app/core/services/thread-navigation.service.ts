import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ThreadNavigationData {
  channelId: string;
  message: any;
  highlightMessageId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThreadNavigationService {
  private threadSubject = new Subject<ThreadNavigationData>();
  threadOpened$ = this.threadSubject.asObservable();

  openThread(channelId: string, message: any, highlightMessageId?: string): void {
    this.threadSubject.next({ channelId, message, highlightMessageId });
  }
}