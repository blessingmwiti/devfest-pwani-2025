'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3400';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Sample queries for quick testing
const SAMPLE_QUERIES = [
  'Show me recent errors in the system',
  'Find checkout failures in the last 30 minutes',
  'Why is the payment service slow?',
  'Check for authentication errors',
];

export default function DevAssistantChat() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI DevOps Assistant. I can help you analyze system logs and debug production issues.\n\nTry asking me:\n- "Show me recent errors"\n- "Find checkout failures in the last 30 minutes"\n- "Why is the payment service slow?"',
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input;
    
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('Sending request to:', `${API_URL}/devAssistant`);
      
      const response = await fetch(`${API_URL}/devAssistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: textToSend }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.result || 'No response received',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error:', errorMessage);
      
      setError(errorMessage);
      
      const errorMsg: Message = {
        role: 'assistant',
        content: `❌ Error connecting to assistant: ${errorMessage}\n\nPlease check:\n- Backend is running at ${API_URL}\n- CORS is enabled\n- Network connection is stable`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const useSampleQuery = (query: string) => {
    setInput(query);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="text-4xl">🤖</span>
                AI DevOps Assistant
              </h1>
              <p className="text-blue-100 mt-1 text-sm">
                Powered by Vertex AI & Cloud Log Analytics | DevFest Pwani 2025
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200">Backend Status</div>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}></div>
                <span className="text-sm font-medium">{error ? 'Disconnected' : 'Connected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Queries */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="text-xs text-gray-500 mb-2">Quick queries:</div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUERIES.map((query, idx) => (
              <button
                key={idx}
                onClick={() => useSampleQuery(query)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <span className="text-xs opacity-70">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ node, inline, className, children, ...props }: any) => {
                        return inline ? (
                          <code
                            className={`${
                              msg.role === 'user'
                                ? 'bg-blue-800 text-blue-100'
                                : 'bg-gray-100 text-gray-800'
                            } px-1.5 py-0.5 rounded text-sm font-mono`}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => <div className="my-2">{children}</div>,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Analyzing logs...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about system logs, errors, or performance issues..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-all duration-200 hover:shadow-lg"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Connected to: {API_URL}
          </div>
        </div>
      </div>
    </div>
  );
}

