'use client';

import { ChatInterface } from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="border-b bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">PantheraChat</h1>
          <p className="text-sm text-gray-600">AI-powered orchestration interface</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full">
        <ChatInterface />
      </div>
    </div>
  );
}
