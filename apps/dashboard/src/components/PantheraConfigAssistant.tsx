'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PantheraConfigAssistantProps {
  currentConfig: unknown;
  onConfigRevised: (revisedConfig: unknown) => void;
}

async function reviseConfig(currentConfig: unknown, instruction: string): Promise<{ revisedConfig: unknown; explanation: string }> {
  const response = await fetch('/api/config/revise', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
    body: JSON.stringify({ currentConfig, instruction }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to revise configuration');
  }
  const data = await response.json();
  console.log('[Panthera] API response:', {
    success: data.success,
    hasRevisedConfig: !!data.revisedConfig,
    explanation: data.explanation,
  });
  return data;
}

export function PantheraConfigAssistant({ currentConfig, onConfigRevised }: PantheraConfigAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm Panthera, your AI configuration assistant. Tell me what you'd like to change in your configuration, and I'll update it for you.\n\nExamples:\n• \"Enable telemetry\"\n• \"Set privacy mode to anonymous\"\n• \"Change log level to detailed\"\n• \"Add vertical: healthcare\"\n• \"Enable autofill\"\n• \"Add ad slot: sidebar\"\n• \"Set authority weight to 0.5\"\n• \"Enable geo nodes and set max cities to 10\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const reviseMutation = useMutation({
    mutationFn: ({ instruction }: { instruction: string }) =>
      reviseConfig(currentConfig, instruction),
    onSuccess: (data, variables) => {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: variables.instruction,
        timestamp: new Date(),
      };

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.explanation + '\n\nConfiguration has been updated. Review the changes in the editor.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      
      // Update the config in parent component
      console.log('[Panthera] Calling onConfigRevised with:', {
        hasRevisedConfig: !!data.revisedConfig,
        revisedConfigType: typeof data.revisedConfig,
        revisedConfigKeys: data.revisedConfig ? Object.keys(data.revisedConfig) : [],
      });
      onConfigRevised(data.revisedConfig);
      
      setInput('');
    },
    onError: (error: Error) => {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !reviseMutation.isPending) {
      reviseMutation.mutate({ instruction: input });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="font-semibold text-gray-900">Panthera AI Assistant</h3>
        </div>
        <p className="text-xs text-gray-600 mt-1">Describe what you want to change</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {reviseMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-gray-700 text-sm">Revising configuration...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Enable telemetry, Set privacy mode to anonymous..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
            disabled={reviseMutation.isPending}
          />
          <button
            type="submit"
            disabled={reviseMutation.isPending || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
          >
            {reviseMutation.isPending ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Apply'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
