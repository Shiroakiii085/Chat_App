import ChatWindow from '@/components/chat/ChatWindow';

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  return <ChatWindow conversationId={params.conversationId} />;
}
