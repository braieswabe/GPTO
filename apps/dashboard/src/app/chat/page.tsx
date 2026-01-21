'use client';

import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">PantheraChat</h1>
        <p className="text-sm text-gray-600">AI-powered orchestration interface</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
