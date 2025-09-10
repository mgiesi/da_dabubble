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
  deleteDoc,
  doc,
  Firestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Channel } from '../../shared/models/channel';
import { where, getDocs } from '@angular/fire/firestore';

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

  constructor() {}

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
   * Gets all member user IDs for a specific channel.
   * Queries the channel's members subcollection.
   *
   * @param channelId - The ID of the channel
   * @returns Promise that resolves to array of user IDs
   */
  async getChannelMembers(channelId: string): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      const membersRef = collection(this.fs, `channels/${channelId}/members`);
      const docs = await getDocs(membersRef);
      return docs.docs.map((doc) => doc.data()['userId']);
    });
  }

  /**
   * Adds a user as member to a channel.
   *
   * @param channelId - The channel ID
   * @param userId - The user ID to add
   * @returns Promise that resolves when member is added
   */
  async addMemberToChannel(channelId: string, userId: string) {
    const memberRef = collection(this.fs, `channels/${channelId}/members`);
    await addDoc(memberRef, {
      userId,
      channelId,
      joinedAt: serverTimestamp(),
    });
  }
}
