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
  parentMessageId?: string;
  threadCount?: number;    
}

export interface DirectMessageConversation {
  id: string;
  participants: string[];
  lastMessage?: DirectMessage;
  lastMessageAt?: Date;
  createdAt?: Date;
}