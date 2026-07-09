'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { GitBranch, GitCommit, Sparkles } from 'lucide-react';

interface GitHubEvent {
  type: string;
  repo: string;
  message: string;
  created_at: string;
}

export default function GitHubWidget() {
  const { data, isLoading, error } = useQuery<GitHubEvent[]>({
    queryKey: ['githubEvents'],
    queryFn: () => fetchFromAPI('/github/events'),
    refetchInterval: 10 * 60 * 1000, // 10분 마다 갱신
  });

  // 시간을 친근한 포맷으로 변환하는 함수
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch {
      return '방금 전';
    }
  };

  if (isLoading) {
    return (
      <WidgetWrapper title="GitHub 활동 로그">
        <div className="text-center text-muted-foreground text-sm my-auto">GitHub 활동 로딩 중...</div>
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper title="GitHub 활동 로그">
        <div className="text-center text-destructive text-xs my-auto">GitHub 활동을 불러오지 못했습니다.</div>
      </WidgetWrapper>
    );
  }

  const hasEvents = data && data.length > 0;
  // 첫 번째 최근 커밋 요약 메시지 추출
  const aiSummary = hasEvents 
    ? `최근 작업인 '${data[0].message}'을(를) 포함하여 총 ${data.length}건의 개발 변경사항이 성공적으로 커밋 및 푸시되었습니다.`
    : "최근에 감지된 깃허브 개발 활동 이력이 없습니다.";

  return (
    <WidgetWrapper title="GitHub 활동 로그">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              {hasEvents ? data[0].repo.split('/')[1] : 'personal-ai-os'} / main
            </span>
          </div>
          {!hasEvents && (
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20 font-medium">
              이력 없음
            </span>
          )}
        </div>

        <div className="space-y-1.5 mb-2 max-h-[85px] overflow-y-auto pr-0.5">
          {hasEvents ? (
            data.map((commit, idx) => (
              <div key={idx} className="flex gap-2 items-start bg-muted/20 p-2 rounded border border-border/10">
                <GitCommit className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate text-foreground/90 font-medium">{commit.message}</p>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-1">
                    <span>{commit.repo.split('/')[0]}</span>
                    <span>{formatTime(commit.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground text-xs py-4">활동 기록이 비어 있습니다.</div>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/20 p-2 rounded-lg flex gap-1.5 items-start">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-normal">
            <strong className="text-primary/95">AI 커밋 요약:</strong> {aiSummary}
          </p>
        </div>
      </div>
    </WidgetWrapper>
  );
}
