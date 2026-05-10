import { create } from 'zustand';
import { IConversation, IMessage } from '@antigravity/types';

interface ChatState {
  conversations: IConversation[];
  activeConversationId: string | null;
  messages: Map<string, IMessage[]>; // conversationId -> messages
  typingUsers: Map<string, string[]>; // conversationId -> userIds
  
  setConversations: (conversations: IConversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: IMessage[]) => void;
  addMessage: (conversationId: string, message: IMessage) => void;
  updateMessageStatus: (conversationId: string, messageId: string, status: IMessage['status']) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: new Map(),
  typingUsers: new Map(),

  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (conversationId, msgs) => set((state) => {
    const newMessages = new Map(state.messages);
    newMessages.set(conversationId, msgs);
    return { messages: newMessages };
  }),
  addMessage: (conversationId, message) => set((state) => {
    const newMessages = new Map(state.messages);
    const existing = newMessages.get(conversationId) || [];
    // prevent duplicate
    if (!existing.find(m => m.id === message.id)) {
      newMessages.set(conversationId, [message, ...existing]);
    }
    return { messages: newMessages };
  }),
  updateMessageStatus: (conversationId, messageId, status) => set((state) => {
    const newMessages = new Map(state.messages);
    const existing = newMessages.get(conversationId) || [];
    newMessages.set(conversationId, existing.map(m => m.id === messageId ? { ...m, status } : m));
    return { messages: newMessages };
  }),
  setTyping: (conversationId, userId, isTyping) => set((state) => {
    const newTyping = new Map(state.typingUsers);
    let users = newTyping.get(conversationId) || [];
    if (isTyping && !users.includes(userId)) users = [...users, userId];
    if (!isTyping) users = users.filter(id => id !== userId);
    newTyping.set(conversationId, users);
    return { typingUsers: newTyping };
  })
}));
