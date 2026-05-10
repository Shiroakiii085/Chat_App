'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSocketStore } from '@/store/useSocketStore';
import { useRouter } from 'next/navigation';
import ConversationList from '@/components/chat/ConversationList';
import ConversationInfo from '@/components/chat/ConversationInfo';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const connectSocket = useSocketStore(state => state.connect);
  const disconnectSocket = useSocketStore(state => state.disconnect);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.push('/login');
      return;
    }
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, [accessToken, connectSocket, disconnectSocket, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      <div className="w-[280px] border-r border-gray-200 flex-shrink-0 flex flex-col">
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
      <div className="w-[320px] border-l border-gray-200 flex-shrink-0 flex flex-col hidden lg:flex">
        <ConversationInfo />
      </div>
    </div>
  );
}
