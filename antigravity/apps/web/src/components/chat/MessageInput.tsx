import { useState, useRef } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { Button } from '@/components/ui/button';
import { Paperclip, Smile, Send } from 'lucide-react';

export default function MessageInput({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState('');
  const sendMessage = useSocketStore(state => state.sendMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(conversationId, content.trim());
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 flex items-end gap-2">
      <Button variant="ghost" size="icon" className="rounded-full text-gray-500">
        <Paperclip className="w-5 h-5" />
      </Button>
      <div className="flex-1 bg-gray-100 rounded-2xl flex items-end px-4 py-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Aa"
          className="w-full bg-transparent border-none focus:outline-none resize-none max-h-[120px]"
          style={{ height: '40px', minHeight: '40px' }}
          rows={1}
        />
        <Button variant="ghost" size="icon" className="rounded-full text-gray-500 -mr-2">
          <Smile className="w-5 h-5" />
        </Button>
      </div>
      <Button 
        size="icon" 
        className="rounded-full bg-blue-600 hover:bg-blue-700 h-10 w-10 flex-shrink-0"
        onClick={handleSend}
      >
        <Send className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
