'use client';

import React from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { GitBranch, GitCommit, Sparkles } from 'lucide-react';

export default function GitHubWidget() {
  const commits = [
    { id: 'a1b2c3d', message: 'feat: AI 대시보드 위젯 아키텍처 초안 작성', author: 'miguel', date: '3시간 전' },
    { id: 'e5f6g7h', message: 'chore: Docker Compose 설정 파일 추가', author: 'miguel', date: '5시간 전' },
  ];

  return (
    <WidgetWrapper title="GitHub 활동 로그">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">personal-ai-os / main</span>
          </div>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 font-medium">데모 데이터</span>
        </div>

        <div className="space-y-1.5 mb-2 max-h-[85px] overflow-y-auto pr-0.5">
          {commits.map((commit) => (
            <div key={commit.id} className="flex gap-2 items-start bg-muted/20 p-2 rounded border border-border/10">
              <GitCommit className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate text-foreground/90 font-medium">{commit.message}</p>
                <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                  <span>{commit.author}</span>
                  <span>{commit.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-primary/20 p-2 rounded-lg flex gap-1.5 items-start">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-normal">
            <strong className="text-primary/95">AI 커밋 요약:</strong> 최근 2건의 작업을 통해 대시보드 위젯 아키텍처 초안과 Docker 컨테이너 설정을 정상 반영했습니다.
          </p>
        </div>
      </div>
    </WidgetWrapper>
  );
}
