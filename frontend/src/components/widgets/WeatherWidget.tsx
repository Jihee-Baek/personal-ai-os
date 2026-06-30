'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { CloudSun, Thermometer, Wind, Droplets } from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
}

export default function WeatherWidget() {
  const { data, isLoading, error } = useQuery<WeatherData>({
    queryKey: ['weather'],
    queryFn: () => fetchFromAPI('/weather'),
    refetchInterval: 30 * 60 * 1000, // 30분 마다 갱신
  });

  if (isLoading) {
    return (
      <WidgetWrapper title="오늘의 날씨">
        <div className="text-center text-muted-foreground text-sm my-auto">날씨 정보 로딩 중...</div>
      </WidgetWrapper>
    );
  }

  if (error) {
    return (
      <WidgetWrapper title="오늘의 날씨">
        <div className="text-center text-destructive text-xs my-auto">날씨 정보를 불러오지 못했습니다.</div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper title="오늘의 날씨">
      <div className="flex flex-col justify-between h-full py-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{data?.location || '서울'}</p>
            <p className="text-xs text-muted-foreground">{data?.condition || '맑음'}</p>
          </div>
          <CloudSun className="w-10 h-10 text-amber-400" />
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-2 border-t border-border/20">
          <div className="flex items-center gap-1">
            <Thermometer className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold">{data?.temperature ?? 24}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">습도 {data?.humidity ?? 60}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-muted-foreground">{data?.wind_speed ?? 2.5} m/s</span>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
}
