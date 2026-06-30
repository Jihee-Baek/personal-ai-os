'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

export default function StocksWidget() {
  const { data, isLoading, error } = useQuery<StockItem[]>({
    queryKey: ['stocks'],
    queryFn: () => fetchFromAPI('/stocks'),
    refetchInterval: 60 * 1000, // 1분 마다 갱신
  });

  return (
    <WidgetWrapper title="주식 관심 종목">
      <div className="flex flex-col h-full justify-between py-1">
        {isLoading ? (
          <div className="text-xs text-muted-foreground my-auto text-center">종목 정보를 로딩 중...</div>
        ) : error ? (
          <div className="text-xs text-destructive my-auto text-center">주식 정보를 불러올 수 없습니다.</div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[120px] pr-1">
            {data && data.length > 0 ? (
              data.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <div key={stock.symbol} className="flex justify-between items-center bg-muted/20 p-2 rounded-md border border-border/10">
                    <div>
                      <span className="text-xs font-bold text-foreground">{stock.symbol}</span>
                      <span className="text-[10px] text-muted-foreground block">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold block">{stock.price.toLocaleString('ko-KR')}원</span>
                      <span className={`text-[10px] font-medium flex items-center justify-end gap-0.5 ${isPositive ? 'text-rose-500' : 'text-blue-500'}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? '+' : ''}{stock.change.toLocaleString('ko-KR')} ({isPositive ? '+' : ''}{stock.change_percent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground py-4 text-center">관심 종목이 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
