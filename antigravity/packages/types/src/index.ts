export enum ConversationType {
  DIRECT = 'DIRECT',
  CHANNEL = 'CHANNEL',
  GROUP = 'GROUP',
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export interface IUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  lastSeen?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IConversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  avatarUrl?: string | null;
  createdAt: Date | string;
  // Included fields via relations
  lastMessage?: IMessage | null;
  members?: IConversationMember[];
  lastReadAt?: Date | string | null;
}

export interface IConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: Role;
  joinedAt: Date | string;
  lastReadAt: Date | string;
  user?: Pick<IUser, 'id' | 'displayName' | 'avatarUrl'>;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  replyToId?: string | null;
  editedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  createdAt: Date | string;
  sender?: Pick<IUser, 'id' | 'displayName' | 'avatarUrl'>;
  status?: 'sending' | 'sent' | 'read' | 'error'; // Frontend only state
}
