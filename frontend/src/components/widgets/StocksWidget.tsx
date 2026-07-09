'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { TrendingUp, TrendingDown, Plus, Trash2, Loader2 } from 'lucide-react';

interface StockItem {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

export default function StocksWidget() {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');

  // 1. 관심 주식 실시간 조회 쿼리
  const { data, isLoading, error } = useQuery<StockItem[]>({
    queryKey: ['stocks'],
    queryFn: () => fetchFromAPI('/stocks'),
    refetchInterval: 30 * 1000, // 30초마다 갱신
  });

  // 2. 관심 주식 추가 뮤테이션
  const addMutation = useMutation({
    mutationFn: (newStock: { symbol: string; name: string }) =>
      fetchFromAPI('/stocks', {
        method: 'POST',
        body: JSON.stringify(newStock),
      }),
    onSuccess: () => {
      // 주식 목록 및 오늘의 브리핑 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
      setSymbol('');
      setName('');
    },
    onError: (err: any) => {
      alert(err.message || '주식 추가에 실패했습니다. 올바른 티커인지 확인해 주세요.');
    },
  });

  // 3. 관심 주식 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchFromAPI(`/stocks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
    },
  });

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !name.trim()) {
      alert('티커 기호와 종목명을 모두 입력해 주세요.');
      return;
    }
    // 예: 삼성전자 "005930.KS", 애플 "AAPL" 등 대문자 변환 후 추가
    addMutation.mutate({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
    });
  };

  return (
    <WidgetWrapper title="주식 관심 종목">
      <div className="flex flex-col h-full justify-between py-1">
        
        {/* 관심 종목 리스트 뷰 영역 */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground my-auto text-center flex items-center justify-center gap-1.5 py-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>실시간 시황 수집 중...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-destructive my-auto text-center py-4">주식 정보를 불러올 수 없습니다.</div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[110px] pr-1 mb-2">
            {data && data.length > 0 ? (
              data.map((stock) => {
                const isPositive = stock.change >= 0;
                return (
                  <div key={stock.symbol} className="flex justify-between items-center bg-muted/20 p-2 rounded-md border border-border/10 group relative">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">{stock.symbol}</span>
                        <span className="text-[9px] text-muted-foreground truncate">{stock.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-foreground/90 block mt-0.5">
                        {stock.price > 0 ? `${stock.price.toLocaleString('ko-KR')}원` : '시황 로드 실패'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        {stock.price > 0 && (
                          <span className={`text-[9px] font-semibold flex items-center justify-end gap-0.5 ${isPositive ? 'text-rose-500' : 'text-blue-500'}`}>
                            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            {isPositive ? '+' : ''}{stock.change.toLocaleString('ko-KR')} ({isPositive ? '+' : ''}{stock.change_percent.toFixed(2)}%)
                          </span>
                        )}
                      </div>
                      
                      {/* 삭제 휴지통 버튼 */}
                      <button
                        onClick={() => deleteMutation.mutate(stock.id)}
                        disabled={deleteMutation.isPending}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10"
                        title="종목 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">등록된 관심 종목이 없습니다.</div>
            )}
          </div>
        )}

        {/* 하단 동적 종목 추가 인풋 폼 영역 */}
        <form onSubmit={handleAddStock} className="flex gap-1.5 items-center pt-2 border-t border-border/10 mt-auto">
          <input
            type="text"
            placeholder="티커 (예: AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="flex-[1.2] bg-muted/40 border border-border/20 text-[10px] rounded px-1.5 py-1 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
            disabled={addMutation.isPending}
          />
          <input
            type="text"
            placeholder="종목명 (예: 애플)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-[1.5] bg-muted/40 border border-border/20 text-[10px] rounded px-1.5 py-1 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
            disabled={addMutation.isPending}
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="bg-primary hover:bg-primary/95 text-primary-foreground p-1 rounded transition-colors flex items-center justify-center disabled:opacity-50 shrink-0"
            title="관심 종목 등록"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </WidgetWrapper>
  );
}
