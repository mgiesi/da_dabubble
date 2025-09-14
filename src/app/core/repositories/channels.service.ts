import {
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { combineLatest, map, Observable, shareReplay, startWith, switchMap, of } from 'rxjs';
import { Channel } from '../../shared/models/channel';
import { where, getDocs } from '@angular/fire/firestore';
import { User } from '../../shared/models/user';
import { UsersFacadeService } from '../facades/users-facade.service';
import { Member } from '../../shared/models/member';

@Injectable({
  providedIn: 'root',
})
/**
 * Service that manages Firestore operations for channels.
 *
 * Provides CRUD methods for `Channel` documents stored in the `channels` collection,
 * including creation, renaming, updating descriptions, deletion, and
 * an observable stream of all channels ordered by name.
 *
 * This service is provided in the root injector and can be used anywhere in the app.
 */
export class ChannelsService {
  private fs = inject(Firestore);
  private injector = inject(Injector);
  private userFacade = inject(UsersFacadeService);

  constructor() { }

  /**
   * Returns an observable stream of all channels ordered by name (ascending).
   *
   * @returns Observable that emits a list of `Channel` objects.
   */
  channels$(): Observable<Channel[]> {
    const ref = collection(this.fs, 'channels');
    const q = query(ref, orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Channel[]>;
  }

  /**
   * Creates a new channel document in Firestore.
   *
   * @param name - The name of the channel.
   * @param ownerId - The ID of the user who owns the channel.
   * @param description - Optional description of the channel (default: empty string).
   * @returns Promise that resolves when the channel has been created.
   */
  async createChannel(name: string, ownerId: string, description = '') {
    return runInInjectionContext(this.injector, async () => {
      const ref = collection(this.fs, 'channels');
      await addDoc(ref, {
        name,
        description,
        ownerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as Channel);
    });
  }

  /**
   * Renames an existing channel in Firestore.
   *
   * @param channelId - The ID of the channel to rename.
   * @param name - The new name for the channel.
   * @returns Promise that resolves when the channel has been updated.
   */
  async renameChannel(channelId: string, name: string) {
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.fs, `channels/${channelId}`);
      await updateDoc(ref, { name: name, updatedAt: serverTimestamp() });
    });
  }

  /**
   * Updates the description of an existing channel in Firestore.
   *
   * @param channelId - The ID of the channel to update.
   * @param description - The new description for the channel.
   * @returns Promise that resolves when the description has been updated.
   */
  async updateDescription(channelId: string, description: string) {
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.fs, `channels/${channelId}`);
      await updateDoc(ref, {
        description: description,
        updatedAt: serverTimestamp(),
      });
    });
  }

  /**
   * Deletes a channel from Firestore.
   *
   * @param channelId - The ID of the channel to delete.
   * @returns Promise that resolves when the channel has been deleted.
   */
  async deleteChannel(channelId: string) {
    return runInInjectionContext(this.injector, async () => {
      const ref = doc(this.fs, `channels/${channelId}`);
      await deleteDoc(ref);
    });
  }

  /**
   * Returns a real-time stream of full `User` objects for all members of a channel.
   *
   * How it works:
   * - Queries the subcollection `channels/{channelId}/members` ordered by `joinedAt` (ascending).
   * - Uses `collectionData(..., { idField: 'id' })` so each member document exposes its doc ID as `id`
   *   (which corresponds to the user ID).
   * - For each member ID, subscribes to `this.userFacade.getUser$(id)` to get live user updates.
   * - Combines all user streams with `combineLatest`, primed by `startWith(null)` so the combined stream
   *   emits immediately, then filters out `null` placeholders.
   * - Shares and replays the latest array of users for all subscribers via `shareReplay(1)`.
   *
   * @param {string} channelId - The Firestore channel document ID.
   * @returns {Observable<User[]>} A shared, hot observable that emits the current list of members as `User[]`.
   */
  getChannelMembers$(channelId: string): Observable<User[]> {
    return runInInjectionContext(this.injector, () => {
      const membersRef = collection(this.fs, `channels/${channelId}/members`) as CollectionReference<Member>;
      const qMembers = query(membersRef, orderBy('joinedAt', 'asc'));

      return collectionData<Member>(qMembers, { idField: 'id' }).pipe(
        switchMap((members) => {
          if (!members.length) return of<User[]>([]);

          const streams = members.map(m =>
            this.userFacade.getUser$(m.id).pipe(
              startWith(null as User | null)
            )
          );

          return combineLatest(streams).pipe(
            map(users => users.filter((u): u is User => !!u))
          );
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    });
  }

  /**
   * Adds a user as member to a channel.
   *
   * @param channelId - The channel ID
   * @param userId - The user ID to add
   */
  async addMemberToChannel(channelId: string, userId: string) {
    const memberRef = doc(this.fs, `channels/${channelId}/members/${userId}`);
    await setDoc(memberRef, {
      joinedAt: serverTimestamp(),
    });
  }

  /**
   * Removes a user as member from a channel.
   *
   * @param channelId - The channel ID
   * @param userId - The user ID to remove
   */
  async removeMemberFromChannel(channelId: string, userId: string) {
    const memberRef = doc(this.fs, `channels/${channelId}/members/${userId}`);
    await deleteDoc(memberRef);
  }
}
