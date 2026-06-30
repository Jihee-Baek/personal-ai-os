'use client';

import React, { useEffect, useState } from 'react';
import { WidgetWrapper } from './WidgetWrapper';
import { Clock } from 'lucide-react';

export default function ClockWidget() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <WidgetWrapper title="현재 시간">
        <div className="text-center text-muted-foreground text-sm">불러오는 중...</div>
      </WidgetWrapper>
    );
  }

  const timeString = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateString = time.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <WidgetWrapper title="현재 시간">
      <div className="flex flex-col items-center justify-center py-4">
        <Clock className="w-8 h-8 text-primary mb-2" />
        <div className="text-3xl font-extrabold tracking-wider tabular-nums text-foreground">
          {timeString}
        </div>
        <div className="text-xs text-muted-foreground mt-2">{dateString}</div>
      </div>
    </WidgetWrapper>
  );
}
