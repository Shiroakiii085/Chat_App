import { useChatStore } from '@/store/useChatStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ConversationInfo() {
  const { conversations, activeConversationId } = useChatStore();
  
  const conversation = conversations.find(c => c.id === activeConversationId);

  if (!conversation) return <div className="p-4 text-center text-gray-400">No chat selected</div>;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100 flex flex-col items-center">
        <Avatar className="w-20 h-20 mb-4">
          <AvatarImage src={conversation.avatarUrl || ''} />
          <AvatarFallback>{conversation.name?.charAt(0) || 'C'}</AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{conversation.name || 'Chat'}</h2>
        <p className="text-sm text-gray-500 capitalize">{conversation.type}</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <h3 className="font-semibold text-sm mb-3">Members ({conversation.members?.length || 0})</h3>
        <div className="flex flex-col gap-2">
          {conversation.members?.map(member => (
            <div key={member.id} className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={member.user?.avatarUrl || ''} />
                <AvatarFallback>{member.user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{member.user?.displayName}</p>
                <p className="text-xs text-gray-500 capitalize">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
