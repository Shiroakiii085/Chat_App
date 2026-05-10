import { IMessage } from '@antigravity/types';
import MessageBubble from './MessageBubble';
import { useRef, useEffect } from 'react';

export default function MessageList({ messages }: { messages: IMessage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simple auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
      <div className="flex flex-col justify-end min-h-full">
        {messages.slice().reverse().map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}
