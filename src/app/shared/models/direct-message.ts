export interface DirectMessage {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderImage: string;
  timestamp: Date;
  dmId: string;
  reactions?: any;
  isOwnMessage?: boolean;
}

export interface DirectMessageConversation {
  id: string;
  participants: string[];
  lastMessage?: DirectMessage;
  lastMessageAt?: Date;
  createdAt?: Date;
}