'use client';

import { ChatInterface } from '@/components/ChatInterface';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function ChatPageContent() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="border-b border-gray-200 bg-white shadow-sm p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">PantheraChat</h1>
          <p className="text-sm text-gray-600">AI-powered orchestration interface</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full bg-white">
        <ChatInterface />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatPageContent />
    </ProtectedRoute>
  );
}
