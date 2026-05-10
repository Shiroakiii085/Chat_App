import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';
import { IMessage } from '@antigravity/types';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (conversationId: string, content: string, type?: string, replyToId?: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connected: false,
  connect: () => {
    const { accessToken } = useAuthStore.getState();
    if (!accessToken) return;

    if (get().socket?.connected) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on('new_message', (data: { message: IMessage }) => {
      useChatStore.getState().addMessage(data.message.conversationId, data.message);
    });

    socket.on('user_typing', (data: { conversationId: string, userId: string, isTyping: boolean }) => {
      useChatStore.getState().setTyping(data.conversationId, data.userId, data.isTyping);
    });

    set({ socket });
  },
  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },
  sendMessage: (conversationId, content, type = 'TEXT', replyToId) => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('send_message', { conversationId, content, type, replyToId }, () => {
         // Optionally update status to 'sent' if we generated an optimistic ID
      });
    }
  }
}));
