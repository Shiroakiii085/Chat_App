'use client';

import { useChatStore } from '@/store/useChatStore';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Video, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const { conversations, messages, typingUsers } = useChatStore();
  const conversation = conversations.find(c => c.id === conversationId);
  const conversationMessages = messages.get(conversationId) || [];
  const typing = typingUsers.get(conversationId) || [];

  if (!conversation) {
    return <div className="flex-1 flex items-center justify-center bg-gray-50/50">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/50">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={conversation.avatarUrl || ''} />
            <AvatarFallback>{conversation.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-gray-900">{conversation.name || 'Chat'}</h2>
            {typing.length > 0 ? (
              <p className="text-xs text-blue-500 animate-pulse">Someone is typing...</p>
            ) : (
              <p className="text-xs text-gray-500">{conversation.members?.length || 0} members</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 lg:hidden">
            <Info className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={conversationMessages} />

      {/* Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
}
