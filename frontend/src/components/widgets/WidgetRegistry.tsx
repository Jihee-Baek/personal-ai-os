import React from 'react';
import { WidgetType, WidgetConfig } from '@/types/widget';

// 개별 위젯 컴포넌트 임포트
import ClockWidget from './ClockWidget';
import WeatherWidget from './WeatherWidget';
import CalendarWidget from './CalendarWidget';
import StocksWidget from './StocksWidget';
import ExchangeWidget from './ExchangeWidget';
import AIChatWidget from './AIChatWidget';
import GitHubWidget from './GitHubWidget';
import MemoWidget from './MemoWidget';
import DailyBriefingWidget from './DailyBriefingWidget';

// 위젯 타입별 매핑 객체
const WIDGET_COMPONENTS: Record<WidgetType, React.ComponentType> = {
  clock: ClockWidget,
  weather: WeatherWidget,
  calendar: CalendarWidget,
  stocks: StocksWidget,
  exchange: ExchangeWidget,
  chat: AIChatWidget,
  github: GitHubWidget,
  memo: MemoWidget,
  briefing: DailyBriefingWidget,
};

// 대시보드 디폴트 배치 구성 (그리드 레이아웃 포함)
// 새로운 위젯 추가 시 이곳에 설정만 더해주면 대시보드 본문에 자동 반영됩니다.
export const DEFAULT_DASHBOARD_LAYOUT: WidgetConfig[] = [
  { id: 'clock', title: '현재 시간', gridSpan: 'col-span-1' },
  { id: 'weather', title: '오늘의 날씨', gridSpan: 'col-span-1' },
  { id: 'exchange', title: '실시간 주요 환율', gridSpan: 'col-span-1' },
  
  { id: 'calendar', title: '일정 및 할 일 관리', gridSpan: 'col-span-1' },
  { id: 'stocks', title: '주식 관심 종목', gridSpan: 'col-span-1' },
  { id: 'github', title: 'GitHub 활동 로그', gridSpan: 'col-span-1' },
  
  { id: 'memo', title: '빠른 마크다운 메모', gridSpan: 'col-span-1' },
  { id: 'briefing', title: '오늘의 AI 종합 브리핑', gridSpan: 'col-span-1 md:col-span-2' },
  
  { id: 'chat', title: 'AI 비서 대화', gridSpan: 'col-span-1 md:col-span-3' },
];

export function renderWidget(config: WidgetConfig) {
  const Component = WIDGET_COMPONENTS[config.id];
  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
        등록되지 않은 위젯 ({config.id})
      </div>
    );
  }
  return <Component />;
}
