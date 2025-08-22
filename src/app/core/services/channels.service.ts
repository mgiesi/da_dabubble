import { inject, Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, orderBy, query, serverTimestamp, updateDoc, where, getDocs } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Channel } from '../../shared/models/channel';

/**
 * Service for managing channel-related operations in Firestore.
 * Handles CRUD operations for channels and channel membership management.
 * Provides reactive streams for channel data and methods for member management.
 */
@Injectable({
  providedIn: 'root'
})
export class ChannelsService {
  private fs = inject(Firestore);

  constructor() { }

  /**
   * Returns an observable stream of all channels ordered by name.
   * The stream updates automatically when channel data changes in Firestore.
   * 
   * @returns Observable that emits an array of Channel objects
   */
  channels$(): Observable<Channel[]> {
    const ref = collection(this.fs, 'channels');
    const q = query(ref, orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Channel[]>;
  }

  /**
   * Creates a new channel in Firestore.
   * 
   * @param name - The name of the channel
   * @param ownerId - The ID of the user who owns the channel
   * @param description - Optional description of the channel (defaults to empty string)
   * @returns Promise that resolves when the channel is created
   */
  async createChannel(name: string, ownerId: string, description = '') {
    const ref = collection(this.fs, 'channels');
    await addDoc(ref, {
      name,
      description,
      ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    } as Channel);
  }

  /**
   * Retrieves the user IDs of all members in a specific channel.
   * Queries the channel's members subcollection to get member data.
   * 
   * @param channelId - The ID of the channel to get members for
   * @returns Promise that resolves to an array of user IDs
   */
  async getChannelMembers(channelId: string): Promise<string[]> {
    const membersRef = collection(this.fs, `channels/${channelId}/members`);
    const docs = await getDocs(membersRef);
    return docs.docs.map(doc => doc.data()['userId']);
  }

  /**
   * Adds a user as a member to a specific channel.
   * Creates a new document in the channel's members subcollection.
   * 
   * @param channelId - The ID of the channel to add the member to
   * @param userId - The ID of the user to add as a member
   * @returns Promise that resolves when the member is added
   */
  async addMemberToChannel(channelId: string, userId: string) {
    const memberRef = collection(this.fs, `channels/${channelId}/members`);
    await addDoc(memberRef, {
      userId,
      channelId,
      joinedAt: serverTimestamp()
    });
  }
}