import {
  Injectable,
  inject,
} from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { DirectMessagesService } from '../repositories/direct-messages.service';
import { UsersFacadeService } from './users-facade.service';
import { DirectMessage } from '../../shared/models/direct-message';

@Injectable({
  providedIn: 'root'
})
export class DirectMessagesFacadeService {
  private directMessagesRepo = inject(DirectMessagesService);
  private usersFacade = inject(UsersFacadeService);
  private auth = inject(Auth);
  

  /**
   * Subscribes to direct messages between current user and target user
   */
  subscribeToDMMessages(
    targetUserId: string,
    callback: (messages: DirectMessage[]) => void
  ): () => void {
    const currentUser = this.getCurrentUser();

    const subscription = this.directMessagesRepo
      .getDMMessages$(currentUser.uid, targetUserId)
      .subscribe(messages => {

        const messagesWithOwnership = this.addOwnershipToMessages(messages);
        callback(messagesWithOwnership);
      });

    return () => subscription.unsubscribe();
  }

  /**
   * Sends direct message to target user
   */
  async sendDMMessage(targetUserId: string, messageText: string): Promise<void> {
    const currentUser = this.getCurrentUser();
    const currentUserData = this.usersFacade.currentUserSig();

    if (!currentUserData) {
      throw new Error('User data not available');
    }

    const messageData = this.createDMMessageData(
      messageText,
      currentUser.uid,
      currentUserData.displayName,
      currentUserData.imgUrl
    );

    try {
      const dmId = await this.directMessagesRepo.ensureDMConversation(currentUser.uid, targetUserId);

      await this.directMessagesRepo.createDMMessage(currentUser.uid, targetUserId, messageData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adds emoji reaction to DM message
   */
  async addDMReaction(dmId: string, messageId: string, emoji: string): Promise<void> {
    const currentUser = this.getCurrentUser();

    try {
      await this.directMessagesRepo.addReactionToDMMessage(
        dmId,
        messageId,
        emoji,
        currentUser.uid
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets current authenticated user
   */
  private getCurrentUser() {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in');
    }
    return currentUser;
  }

  /**
   * Creates direct message data object
   */
  private createDMMessageData(
    text: string,
    senderId: string,
    senderName: string,
    senderImage: string
  ): Partial<DirectMessage> {
    return {
      text,
      senderId,
      senderName,
      senderImage,
      reactions: {},
    };
  }

  /**
   * Adds ownership flag to direct messages
   */
  private addOwnershipToMessages(messages: DirectMessage[]): DirectMessage[] {
    const currentUserId = this.auth.currentUser?.uid;

    return messages.map((message) => ({
      ...message,
      isOwnMessage: message.senderId === currentUserId,
    }));
  }

  /**
 * Updates a direct message text
 */
  async updateDMMessage(dmId: string, messageId: string, newText: string): Promise<void> {
    try {
      await this.directMessagesRepo.updateDMMessageText(dmId, messageId, newText);
    } catch (error) {
      console.error('Error updating DM message:', error);
      throw error;
    }
  }

  /**
   * Deletes a direct message
   */
  async deleteDMMessage(dmId: string, messageId: string): Promise<void> {
    try {
      await this.directMessagesRepo.deleteDMMessage(dmId, messageId);
    } catch (error) {
      console.error('Error deleting DM message:', error);
      throw error;
    }
  }
}