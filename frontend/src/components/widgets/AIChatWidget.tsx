'use client';

import React, { useState } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { Send, Bot } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AIChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '안녕하세요! 저는 Personal AI OS 비서입니다. 무엇을 도와드릴까요?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const data = await fetchFromAPI('/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg }),
      });
      setMessages((prev) => [...prev, { sender: 'ai', text: data.reply || '답변을 가져오지 못했습니다.' }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: '에러: 백엔드 서버와 통신하는 도중 문제가 발생했습니다.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WidgetWrapper title="AI 비서 대화">
      <div className="flex flex-col h-full min-h-[220px] justify-between py-1">
        <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 max-h-[160px]">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'ai' && <Bot className="w-4 h-4 text-primary shrink-0 mt-1" />}
              <div
                className={`p-2 rounded-lg max-w-[85%] text-xs ${
                  msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border/20 text-foreground'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <Bot className="w-4 h-4 text-primary shrink-0 animate-pulse mt-1" />
              <div className="p-2 rounded-lg bg-muted text-xs text-muted-foreground">생각 중...</div>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSend} className="flex gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            className="flex-1 bg-muted/60 border border-border px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-primary/50 text-foreground"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-lg text-xs flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </WidgetWrapper>
  );
}
