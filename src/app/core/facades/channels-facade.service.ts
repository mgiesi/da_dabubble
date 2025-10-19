import { inject, Injectable } from '@angular/core';
import { ChannelsService } from '../repositories/channels.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UsersFacadeService } from './users-facade.service';
import { combineLatest, filter, firstValueFrom, map, Observable, of, switchMap, tap } from 'rxjs';
import { User } from '../../shared/models/user';
import { Channel } from '../../shared/models/channel';
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
  private users = inject(UsersFacadeService);

  /** Current logged in user */
  private readonly currentUser$ = toObservable(this.users.currentUserSig).pipe(
    filter((u): u is User => u != null)
  );
  
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
   * Returns a channel object from the cached channel list by its name.
   *
   * @param name The name of the channel to look up.
   * @returns The matching channel object if found, otherwise `undefined`.
   */
  getChannelByName(channelName: string): Channel | undefined {
    return this.channels().find(c => c.name === channelName);
  }

  /**
   * Returns a channel object from the cached channel list by its id.
   * 
   * @param channelId The ID of the channel to look for.
   * @returns The matching channel object if found, otherwise `undefined`.
   */
  getChannelById(channelId: string): Channel | undefined {
    return this.channels().find(c => c.id === channelId);
  }

  /**
   * Lists only the visible channels for the current user.
   * 
   * 
   */
  readonly visibleChannelsSig = toSignal(
    combineLatest([
      this.data.channels$(),
      this.currentUser$
    ]).pipe(
      switchMap(([channels, user]) => {
        const memberStreams = channels.map(ch =>
          this.data.getChannelMembers$(ch.id).pipe(
            map(members => ({
              ...ch,
              isMember: members.some(m => m.id === user.id)
            }))
          )
        );

        return memberStreams.length
          ? combineLatest(memberStreams)
          : of([] as any[]);
      }),
      map(chs => 
        chs.filter(c => c.isMember || c.visibility === 'public')
      )
    ),
    {initialValue: [] as any[] }
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
  async createChannel(name: string, description: string = ''): Promise<string | null> {
    const userObs = this.users.currentUser();
    if (!userObs) {
      return null;
    }
    const user = await firstValueFrom(userObs);
    if (!user) {
      return null;
    }
    return await this.data.createChannel(name, user.id, description);
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

  /**
   * Gets member user IDs for a specific channel.
   * 
   * @param channelId - The channel ID to get members for
   * @returns Promise with array of user IDs
   */
  getChannelMembers$(channelId: string): Observable<User[]> {
    return this.data.getChannelMembers$(channelId);
  }

  /**
   * Adds a user to a channel as member.
   * 
   * @param channelId - The channel ID
   * @param userId - The user ID to add
   */
  async addMemberToChannel(channelId: string, userId: string) {
    await this.data.addMemberToChannel(channelId, userId);
  }

  /**
   * Removes a user from a channel as member.
   * 
   * @param channelId - The channel ID
   * @param userId - The user ID to remove
   */
  async removeMemberFromChannel(channelId: string, userId: string) {
    await this.data.removeMemberFromChannel(channelId, userId);
  }
}
