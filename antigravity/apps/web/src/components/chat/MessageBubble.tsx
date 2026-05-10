import { IMessage } from '@antigravity/types';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, CheckCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function MessageBubble({ message }: { message: IMessage }) {
  const { user } = useAuthStore();
  const isMine = user?.id === message.senderId;

  const StatusIcon = () => {
    if (message.status === 'sending') return <Clock className="w-3 h-3 text-white/70" />;
    if (message.status === 'sent') return <Check className="w-3 h-3 text-white/70" />;
    if (message.status === 'read') return <CheckCheck className="w-3 h-3 text-white" />;
    return <Check className="w-3 h-3 text-white/70" />; // Default to sent if no status but from me
  };

  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[70%] gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMine && (
          <Avatar className="w-8 h-8 mt-auto">
            <AvatarImage src={message.sender?.avatarUrl || ''} />
            <AvatarFallback>{message.sender?.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        )}
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
          {!isMine && (
            <span className="text-xs text-gray-500 ml-1 mb-1">{message.sender?.displayName}</span>
          )}
          <div className={`px-4 py-2 rounded-2xl relative group ${
            isMine 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            <div className={`flex items-center gap-1 mt-1 justify-end ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
              <span className="text-[10px] leading-none">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {isMine && <StatusIcon />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
