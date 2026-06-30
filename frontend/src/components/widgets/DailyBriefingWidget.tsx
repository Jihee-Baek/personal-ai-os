'use client';

import React from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { Sparkles, Calendar, CloudSun, TrendingUp } from 'lucide-react';

export default function DailyBriefingWidget() {
  return (
    <WidgetWrapper title="오늘의 AI 종합 브리핑">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg flex gap-2 items-start mb-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-normal">
            <span className="font-extrabold text-foreground block mb-1">좋은 아침입니다!</span>
            오늘 하루의 일정, 날씨, 보유 주식 시황 및 깃허브 커밋 등을 취합하여 AI가 종합 브리핑을 제공할 예정입니다.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 p-2 rounded border border-border/10 flex flex-col items-center text-center">
            <Calendar className="w-4.5 h-4.5 text-indigo-400 mb-1" />
            <span className="text-[9px] text-muted-foreground block">오늘의 할 일</span>
            <span className="text-xs font-bold text-foreground mt-0.5">3건 예정</span>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border/10 flex flex-col items-center text-center">
            <CloudSun className="w-4.5 h-4.5 text-amber-400 mb-1" />
            <span className="text-[9px] text-muted-foreground block">오늘의 날씨</span>
            <span className="text-xs font-bold text-foreground mt-0.5">맑음, 24°C</span>
          </div>
          <div className="bg-muted/30 p-2 rounded border border-border/10 flex flex-col items-center text-center">
            <TrendingUp className="w-4.5 h-4.5 text-rose-400 mb-1" />
            <span className="text-[9px] text-muted-foreground block">관심 종목</span>
            <span className="text-xs font-bold text-foreground mt-0.5">상승 흐름</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
