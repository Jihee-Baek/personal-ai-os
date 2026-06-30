'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { Landmark, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ExchangeItem {
  currency: string;
  rate: number;
  change: number;
  change_percent: number;
}

export default function ExchangeWidget() {
  const { data, isLoading, error } = useQuery<ExchangeItem[]>({
    queryKey: ['exchange'],
    queryFn: () => fetchFromAPI('/exchange'),
    refetchInterval: 5 * 60 * 1000, // 5분 마다 갱신
  });

  return (
    <WidgetWrapper title="주요 환율 정보">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="flex items-center gap-2 mb-3">
          <Landmark className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">실시간 주요 환율</span>
        </div>
        
        {isLoading ? (
          <div className="text-xs text-muted-foreground my-auto text-center">환율 정보를 불러오는 중...</div>
        ) : error ? (
          <div className="text-xs text-destructive my-auto text-center">환율 정보를 가져오지 못했습니다.</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {data && data.length > 0 ? (
              data.map((item) => {
                const isPositive = item.change >= 0;
                return (
                  <div key={item.currency} className="bg-muted/30 p-2 rounded-md border border-border/10 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground block">{item.currency}/KRW</span>
                    <span className="text-xs font-extrabold block my-1 text-foreground">
                      {item.rate.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[9px] font-semibold inline-flex items-center justify-center gap-0.5 ${isPositive ? 'text-rose-500' : 'text-blue-500'}`}>
                      {isPositive ? <ArrowUpRight className="w-2.5 h-2.5 shrink-0" /> : <ArrowDownRight className="w-2.5 h-2.5 shrink-0" />}
                      {isPositive ? '+' : ''}{item.change_percent.toFixed(2)}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground py-4 text-center col-span-3">환율 정보가 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
