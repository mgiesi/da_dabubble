export interface ChannelMessage {
  id?: string;
  text: string;
  senderId: string;
  timestamp: Date;
  topicId: string;
  channelId: string;
  reactions?: any;
  parentMessageId?: string;
  threadCount?: number;
  isOwnMessage?: boolean;
}

export interface Topic {
  id?: string;
  name?: string;
  channelId: string;
  messageCount?: number;
  lastMessageAt?: Date;
}