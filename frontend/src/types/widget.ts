export interface WidgetProps {
  id: string;
  title: string;
}

export type WidgetType =
  | 'clock'
  | 'weather'
  | 'calendar'
  | 'stocks'
  | 'exchange'
  | 'chat'
  | 'github'
  | 'memo'
  | 'briefing';

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  gridSpan: string; // Tailwind 그리드 스팬 클래스 예: 'col-span-1 row-span-1'
}
