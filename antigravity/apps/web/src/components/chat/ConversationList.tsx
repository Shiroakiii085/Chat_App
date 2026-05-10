import { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';

export default function ConversationList() {
  const [search, setSearch] = useState('');
  const { conversations, activeConversationId, setActiveConversation } = useChatStore();
  const router = useRouter();

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    router.push(`/${id}`);
  };

  const filtered = conversations.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.members?.some(m => m.user?.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold mb-4">Chats</h2>
        <Input 
          placeholder="Search..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-50 border-none"
        />
      </div>
      
      <Tabs defaultValue="all" className="flex flex-col flex-1">
        <div className="px-4 py-2 border-b border-gray-100">
          <TabsList className="w-full justify-start h-9 bg-transparent p-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-100 rounded-full px-4">All</TabsTrigger>
            <TabsTrigger value="direct" className="data-[state=active]:bg-gray-100 rounded-full px-4">DM</TabsTrigger>
            <TabsTrigger value="group" className="data-[state=active]:bg-gray-100 rounded-full px-4">Groups</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="flex-1 m-0">
          <ScrollArea className="h-full">
            {filtered.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => handleSelect(conv.id)}
                className={`flex items-center gap-3 p-3 mx-2 my-1 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${activeConversationId === conv.id ? 'bg-blue-50' : ''}`}
              >
                <Avatar>
                  <AvatarImage src={conv.avatarUrl || ''} />
                  <AvatarFallback>{conv.name?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-medium text-sm truncate">{conv.name || 'Chat'}</h3>
                  <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content || 'No messages yet'}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
