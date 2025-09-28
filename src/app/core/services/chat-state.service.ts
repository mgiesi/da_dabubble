import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ChatMode = 'channel' | 'direct-message';

@Injectable({
  providedIn: 'root'
})
export class ChatStateService {
  private readonly _currentMode = new BehaviorSubject<ChatMode>('channel');
  private readonly _selectedChannelId = new BehaviorSubject<string | null>(null);
  private readonly _selectedUserId = new BehaviorSubject<string | null>(null);

  readonly currentMode$ = this._currentMode.asObservable();
  readonly selectedChannelId$ = this._selectedChannelId.asObservable();
  readonly selectedUserId$ = this._selectedUserId.asObservable();

  /**
   * Switches to channel mode
   */
  switchToChannel(channelId: string): void {
    this._currentMode.next('channel');
    this._selectedChannelId.next(channelId);
    this._selectedUserId.next(null);
  }

  /**
   * Switches to direct message mode
   */
  switchToDirectMessage(userId: string): void {
    this._currentMode.next('direct-message');
    this._selectedUserId.next(userId);
    this._selectedChannelId.next(null);
  }

  /**
   * Gets current chat mode
   */
  getCurrentMode(): ChatMode {
    return this._currentMode.value;
  }

  /**
   * Gets selected channel ID
   */
  getSelectedChannelId(): string | null {
    return this._selectedChannelId.value;
  }

  /**
   * Gets selected user ID for DM
   */
  getSelectedUserId(): string | null {
    return this._selectedUserId.value;
  }
}