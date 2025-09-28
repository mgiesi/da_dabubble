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
    
    console.log('📡 DM Subscription Debug:');
    console.log('Current User UID (subscription):', currentUser.uid);
    console.log('Target User ID (subscription):', targetUserId);

    const subscription = this.directMessagesRepo
      .getDMMessages$(currentUser.uid, targetUserId)
      .subscribe(messages => {
        console.log('📨 Received DM messages:', messages.length);
        console.log('Messages:', messages);
        
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
    
    console.log('🔍 DM Debug Info:');
    console.log('Current User UID:', currentUser.uid);
    console.log('Target User ID:', targetUserId);
    console.log('Current User Data:', currentUserData);
    
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
      console.log('Created/Found DM ID:', dmId);
      
      await this.directMessagesRepo.createDMMessage(currentUser.uid, targetUserId, messageData);
      console.log('✅ DM sent successfully');
    } catch (error) {
      console.error("Error sending DM:", error);
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
      console.error("Failed to add DM reaction:", error);
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
}