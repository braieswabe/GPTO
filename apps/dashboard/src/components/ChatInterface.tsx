'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    mode?: string;
    servos?: string[];
    apmWeights?: {
      w_ps: number;
      w_mf: number;
      w_vf: number;
    };
  };
}

async function sendMessage(message: string): Promise<{ response: { message: string; metadata: unknown } }> {
  const response = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: new Date(),
      };
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response.message,
        timestamp: new Date(),
        metadata: data.response.metadata as Message['metadata'],
      };
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMutation.mutate(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation with PantheraChat</p>
            <p className="text-sm mt-2">Try: "Generate a blog post about trucking recruitment"</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{message.content}</p>
              {message.metadata && (
                <div className="text-xs mt-2 opacity-75">
                  {message.metadata.mode && (
                    <span>Mode: {message.metadata.mode} | </span>
                  )}
                  {message.metadata.apmWeights && (
                    <span>
                      PS: {(message.metadata.apmWeights.w_ps * 100).toFixed(0)}% | 
                      MF: {(message.metadata.apmWeights.w_mf * 100).toFixed(0)}% | 
                      VF: {(message.metadata.apmWeights.w_vf * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg p-3">
              <p>Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded"
            disabled={sendMutation.isPending}
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
