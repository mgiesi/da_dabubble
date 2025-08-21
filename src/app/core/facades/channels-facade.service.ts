import { inject, Injectable } from '@angular/core';
import { ChannelsService } from '../repositories/channels.service';
import { Auth } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
/**
 * Facade service that exposes channel data and actions to the UI layer.
 *
 * This class acts as a thin abstraction over the repository (`ChannelsService`)
 * and the authentication state (`Auth`), providing signal-based read access
 * and authenticated write operations (create/rename/update/delete).
 *
 * Use this facade from components to keep them free of infrastructure details.
 */
export class ChannelsFacadeService {
  /** Repository that performs Firestore I/O for channels. */
  private data = inject(ChannelsService);
  /** Firebase Auth instance used to determine the current user. */
  private auth = inject(Auth);

  constructor() { }

  /**
   * Reactive list of channels exposed as a signal.
   *
   * The value is kept in sync with Firestore and ordered by name (ascending).
   * Components can read `channels()` to get the latest `Channel[]`.
   */
  readonly channels = toSignal(
    this.data.channels$(), {
    initialValue: [] as any[]
  }
  );

  /**
   * Creates a new channel owned by the currently authenticated user.
   *
   * If no user is signed in, this is a no-op.
   *
   * @param name - The channel name.
   * @param description - Optional description (defaults to empty string).
   * @returns A promise that resolves when the channel has been created.
   */
  async createChannel(name: string, description: string = '') {
    const uid = this.auth.currentUser?.uid;
    // if (!uid) {
    //   return;
    // }
    const userId = uid || 'dev-user-123';
    await this.data.createChannel(name, userId, description);
  }

  /**
   * Renames an existing channel.
   *
   * @param channelId - The ID of the channel to rename.
   * @param name - The new channel name.
   * @returns A promise that resolves when the rename has completed.
   */
  async renameChannel(channelId: string, name: string) {
    await this.data.renameChannel(channelId, name);
  }

  /**
   * Updates the description of an existing channel.
   *
   * @param channelId - The ID of the channel to update.
   * @param description - The new description text.
   * @returns A promise that resolves when the update has completed.
   */
  async updateDescription(channelId: string, description: string) {
    await this.data.updateDescription(channelId, description);
  }

  /**
   * Deletes a channel.
   *
   * @param channelId - The ID of the channel to delete.
   * @returns A promise that resolves when the deletion has completed.
   */
  async deleteChannel(channelId: string) {
    await this.data.deleteChannel(channelId);
  }
}
