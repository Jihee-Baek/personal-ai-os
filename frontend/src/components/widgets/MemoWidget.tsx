'use client';

import React, { useState, useEffect } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { FileText, Save, Sparkles } from 'lucide-react';

export default function MemoWidget() {
  const [memo, setMemo] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('quick_memo');
    if (saved) {
      setMemo(saved);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('quick_memo', memo);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <WidgetWrapper title="빠른 마크다운 메모">
      <div className="flex flex-col h-full justify-between py-1">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="아이디어나 지식을 여기에 자유롭게 기재하세요... (마크다운 지원 예정)"
          className="flex-1 min-h-[90px] w-full bg-muted/40 border border-border/60 p-2.5 rounded-lg text-xs focus:outline-none focus:border-primary/50 text-foreground resize-none"
        />
        
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/20">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-primary/5 border border-primary/10 px-2 py-1 rounded">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <span>AI 태그 / 자동 요약 지원 예정</span>
          </div>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-1 bg-secondary hover:bg-secondary/80 text-foreground text-xs px-2.5 py-1.2 rounded-md cursor-pointer transition-colors border border-border/60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaved ? '저장 완료' : '저장'}</span>
          </button>
        </div>
      </div>
    </WidgetWrapper>
  );
}
