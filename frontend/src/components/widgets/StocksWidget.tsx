'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { TrendingUp, TrendingDown, Plus, Trash2, Loader2, Search } from 'lucide-react';

interface StockItem {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

interface SuggestionItem {
  symbol: string;
  name: string;
  market: string;
}

export default function StocksWidget() {
  const queryClient = useQueryClient();
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // 1. 관심 주식 실시간 시황 조회 쿼리
  const { data, isLoading, error } = useQuery<StockItem[]>({
    queryKey: ['stocks'],
    queryFn: () => fetchFromAPI('/stocks'),
    refetchInterval: 30 * 1000,
  });

  // 2. 관심 주식 추가
  const addMutation = useMutation({
    mutationFn: (newStock: { symbol: string; name: string }) =>
      fetchFromAPI('/stocks', {
        method: 'POST',
        body: JSON.stringify(newStock),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
      setSymbol('');
      setName('');
      setShowSuggestions(false);
    },
    onError: (err: any) => {
      alert(err.message || '주식 추가에 실패했습니다.');
    },
  });

  // 3. 관심 주식 삭제
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

  // 💡 [실시간 검색 디바운스] 사용자가 티커 입력란에 타이핑 시 250ms 대기 후 백엔드 검색 API 호출
  useEffect(() => {
    if (!symbol.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    // 만약 이미 자동완성 선택을 완료해 종목명이 채워져 있는 경우 API 조회를 막습니다.
    if (name && symbol) {
      const match = suggestions.find(s => s.symbol === symbol && s.name === name);
      if (match) return; 
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetchFromAPI(`/stocks/search?q=${encodeURIComponent(symbol)}`);
        setSuggestions(res);
        setShowSuggestions(res.length > 0);
      } catch (err) {
        console.error('주식 실시간 API 검색 실패:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [symbol]);

  // 자동완성 제안 아이템 클릭 시 폼 주입 핸들러
  const handleSelectSuggestion = (item: SuggestionItem) => {
    setSymbol(item.symbol);
    setName(item.name);
    setShowSuggestions(false);
  };

  // 외부 영역 클릭 감지 및 제안창 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !name.trim()) {
      alert('검색창에 입력하여 올바른 종목을 선택하거나 티커/이름을 입력해 주세요.');
      return;
    }
    addMutation.mutate({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
    });
  };

  return (
    <WidgetWrapper title="주식 관심 종목">
      <div className="flex flex-col h-full justify-between py-1 relative">
        
        {/* 관심 종목 시황 리스트 */}
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
                  <div key={stock.symbol} className="flex justify-between items-center bg-muted/20 p-2 rounded-md border border-border/10">
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

        {/* 💡 [실시간 검색 엔진 팝업] 야후 파이낸스 실시간 매핑 드롭다운 */}
        {showSuggestions && (
          <div 
            ref={suggestionRef} 
            className="absolute bottom-11 left-0 right-0 bg-background/95 backdrop-blur-md border border-border/85 rounded-md shadow-2xl z-50 max-h-[140px] overflow-y-auto"
          >
            {suggestions.map((item) => (
              <div
                key={item.symbol}
                onClick={() => handleSelectSuggestion(item)}
                className="flex items-center justify-between px-3 py-2 text-[10px] text-foreground hover:bg-primary/10 cursor-pointer border-b border-border/10 last:border-b-0 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-bold">{item.symbol}</span>
                  <span className="text-[9px] text-muted-foreground line-clamp-1">{item.name}</span>
                </div>
                <span className="text-[8px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground shrink-0 font-bold ml-2">
                  {item.market}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 하단 동적 종목 추가 인풋 폼 */}
        <form onSubmit={handleAddStock} className="flex gap-1.5 items-center pt-2 border-t border-border/10 mt-auto">
          <div className="flex-[1.5] relative">
            <input
              type="text"
              placeholder="검색어 (예: 삼성, AAPL)"
              value={symbol}
              onChange={(e) => {
                setSymbol(e.target.value);
                setName(''); // 타이핑 중에는 종목명을 리셋하여 조회를 허용합니다.
              }}
              className="w-full bg-muted/40 border border-border/20 text-[10px] rounded px-1.5 py-1 pr-6 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
              disabled={addMutation.isPending}
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
              {isSearching ? (
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              ) : (
                <Search className="w-3 h-3 text-muted-foreground/60" />
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="선택된 종목명"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-[1.2] bg-muted/40 border border-border/20 text-[10px] rounded px-1.5 py-1 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
            disabled={addMutation.isPending}
          />
          <button
            type="submit"
            disabled={addMutation.isPending || !symbol || !name}
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
