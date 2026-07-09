'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { Sparkles, Calendar, CloudSun, TrendingUp } from 'lucide-react';

interface BriefingData {
  content: string;
  created_at: string;
}

export default function DailyBriefingWidget() {
  // 1. 메인 AI 브리핑 데이터 구독
  const { data: briefing, isLoading: isBriefingLoading, error: briefingError } = useQuery<BriefingData>({
    queryKey: ['briefing'],
    queryFn: () => fetchFromAPI('/briefing'),
    refetchInterval: 60 * 60 * 1000, // 1시간 마다 갱신
  });

  // 2. 다른 위젯의 캐시된 상태 공유 구독 (네트워크 트래픽 거의 없음)
  const { data: weather } = useQuery<any>({ queryKey: ['weather'], enabled: false });
  const { data: todos } = useQuery<any[]>({ queryKey: ['todos'], enabled: false });
  const { data: stocks } = useQuery<any[]>({ queryKey: ['stocks'], enabled: false });

  if (isBriefingLoading) {
    return (
      <WidgetWrapper title="오늘의 AI 종합 브리핑">
        <div className="text-center text-muted-foreground text-sm my-auto">AI 비서 브리핑 리포트 분석 중...</div>
      </WidgetWrapper>
    );
  }

  if (briefingError) {
    return (
      <WidgetWrapper title="오늘의 AI 종합 브리핑">
        <div className="text-center text-destructive text-xs my-auto">브리핑 데이터를 생성하지 못했습니다.</div>
      </WidgetWrapper>
    );
  }

  // 미완료 할 일 갯수 계산
  const uncompletedTodoCount = todos ? todos.filter((t: any) => !t.completed).length : 0;
  // 주가 등락 종목 수 계산
  const upStocksCount = stocks ? stocks.filter((s: any) => s.change > 0).length : 0;

  return (
    <WidgetWrapper title="오늘의 AI 종합 브리핑">
      <div className="flex flex-col h-full justify-between py-1">
        
        {/* AI 생성 요약 브리프 본문 영역 */}
        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex gap-2.5 items-start mb-3 max-h-[160px] overflow-y-auto">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">
            {briefing?.content || '좋은 아침입니다! 오늘의 리포트를 읽어오는 중 오류가 있었습니다.'}
          </div>
        </div>

        {/* 3대 정량 지표 실시간 카운트 뱃지 그리드 */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <div className="bg-muted/30 p-2 rounded border border-border/10 flex flex-col items-center text-center">
            <Calendar className="w-4 h-4 text-indigo-400 mb-1" />
            <span className="text-[9px] text-muted-foreground block">오늘의 할 일</span>
            <span className="text-xs font-bold text-foreground mt-0.5">
              {todos ? `${uncompletedTodoCount}건 예정` : '조회 안됨'}
            </span>
          </div>
          
          <div className="bg-muted/30 p-2 rounded border border-border/10 flex flex-col items-center text-center">
            <CloudSun className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[9px] text-muted-foreground block">오늘의 날씨</span>
            <span className="text-xs font-bold text-foreground mt-0.5">
              {weather ? `${Math.round(weather.temperature)}°C, ${weather.condition}` : '조회 안됨'}
            </span>
          </div>
          
          <div className="bg-muted/30 p-2 rounded border border-border/10 flex flex-col items-center text-center">
            <TrendingUp className="w-4.5 h-4.5 text-rose-400 mb-1" />
            <span className="text-[9px] text-muted-foreground block">관심 종목</span>
            <span className="text-xs font-bold text-foreground mt-0.5">
              {stocks ? `${upStocksCount}개 상승` : '조회 안됨'}
            </span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
