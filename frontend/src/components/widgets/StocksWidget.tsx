'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { 
  TrendingUp, TrendingDown, Plus, Trash2, Loader2, Search, 
  Edit3, LineChart, X, Check, DollarSign, PieChart, RefreshCw 
} from 'lucide-react';

interface PortfolioSummary {
  total_invested: number;
  total_evaluated: number;
  total_profit_loss: number;
  total_profit_rate: number;
}

interface StockPortfolioItem {
  id: number;
  symbol: string;
  name: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
  change: number;
  change_percent: number;
  total_invested: number;
  total_evaluated: number;
  profit_loss: number;
  profit_rate: number;
}

interface StockPortfolioResponse {
  summary: PortfolioSummary;
  items: StockPortfolioItem[];
}

interface SuggestionItem {
  symbol: string;
  name: string;
  market: string;
}

interface ChartPoint {
  timestamp: string;
  price: number;
}

interface StockChartResponse {
  symbol: string;
  range: string;
  points: ChartPoint[];
}

export default function StocksWidget() {
  const queryClient = useQueryClient();
  
  // 1. 등록 폼 상태 (종목명, 티커, 수량, 평균매수가)
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<string>('1');
  const [avgBuyPrice, setAvgBuyPrice] = useState<string>('100');
  
  // 검색 제안 팝업
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // 2. 수정(Edit) 모드 상태
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editAvgPrice, setEditAvgPrice] = useState<string>('');

  // 3. 차트(Chart) 선택 상태 (클릭된 종목 및 기간)
  const [selectedStock, setSelectedStock] = useState<StockPortfolioItem | null>(null);
  const [chartRange, setChartRange] = useState<string>('1m');

  // 📈 실시간 보유 주식 포트폴리오 데이터 쿼리 (1~5분 주기 갱신)
  const { data, isLoading, error, refetch, isRefetching } = useQuery<StockPortfolioResponse>({
    queryKey: ['stocks'],
    queryFn: () => fetchFromAPI('/stocks'),
    refetchInterval: 60 * 1000, // 1분 마다 실시간 갱신
  });

  // 📊 기간별 주가 차트 쿼리
  const { data: chartData, isLoading: isChartLoading } = useQuery<StockChartResponse>({
    queryKey: ['stockChart', selectedStock?.symbol, chartRange],
    queryFn: () => fetchFromAPI(`/stocks/${selectedStock?.symbol}/chart?range=${chartRange}`),
    enabled: !!selectedStock,
  });

  // ➕ 신규 보유 종목 등록 뮤테이션
  const addMutation = useMutation({
    mutationFn: (newStock: { symbol: string; name: string; quantity: number; avg_buy_price: number }) =>
      fetchFromAPI('/stocks', {
        method: 'POST',
        body: JSON.stringify(newStock),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
      setSymbol('');
      setName('');
      setQuantity('1');
      setAvgBuyPrice('100');
      setShowSuggestions(false);
    },
    onError: (err: any) => {
      alert(err.message || '종목 등록에 실패했습니다.');
    },
  });

  // ✏️ 보유 종목 수량 및 평단가 수정 뮤테이션
  const updateMutation = useMutation({
    mutationFn: ({ id, quantity, avg_buy_price }: { id: number; quantity: number; avg_buy_price: number }) =>
      fetchFromAPI(`/stocks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity, avg_buy_price }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
      setEditingId(null);
    },
    onError: (err: any) => {
      alert(err.message || '수정에 실패했습니다.');
    },
  });

  // 🗑️ 보유 종목 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchFromAPI(`/stocks/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
      if (selectedStock && data) {
        setSelectedStock(null);
      }
    },
  });

  // 실시간 검색 디바운스
  useEffect(() => {
    if (!symbol.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

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
        console.error('티커 실시간 검색 실패:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [symbol]);

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setSymbol(item.symbol);
    setName(item.name);
    setShowSuggestions(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 종목 등록제출
  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim() || !name.trim()) {
      alert('검색어를 입력해 올바른 티커 종목을 선택하거나 입력해 주세요.');
      return;
    }
    const qty = parseFloat(quantity);
    const price = parseFloat(avgBuyPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      alert('올바른 보유 수량과 평균 매수가를 입력해 주세요.');
      return;
    }

    addMutation.mutate({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      quantity: qty,
      avg_buy_price: price,
    });
  };

  // 수정 시작
  const startEditing = (stock: StockPortfolioItem) => {
    setEditingId(stock.id);
    setEditQuantity(stock.quantity.toString());
    setEditAvgPrice(stock.avg_buy_price.toString());
  };

  // 수정 완료
  const handleSaveEdit = (id: number) => {
    const qty = parseFloat(editQuantity);
    const price = parseFloat(editAvgPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      alert('올바른 수량과 매수가를 입력해 주세요.');
      return;
    }
    updateMutation.mutate({ id, quantity: qty, avg_buy_price: price });
  };

  // 통화 및 금액 포맷터
  const formatCurrency = (val: number, symbolStr: string = '') => {
    const isKr = symbolStr.endsWith('.KS') || symbolStr.endsWith('.KQ');
    if (isKr) {
      return `${Math.round(val).toLocaleString('ko-KR')}원`;
    }
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 손익 및 수익률 색상 헬퍼 (수익: 초록 / 손실: 빨간 / 보합: 회색)
  const getProfitColorClass = (val: number) => {
    if (val > 0) return 'text-emerald-400 font-extrabold';
    if (val < 0) return 'text-rose-500 font-extrabold';
    return 'text-muted-foreground font-bold';
  };

  const summary = data?.summary;
  const items = data?.items || [];
  const isOverallPositive = (summary?.total_profit_loss || 0) >= 0;

  return (
    <WidgetWrapper title="💼 보유 주식 포트폴리오">
      <div className="flex flex-col h-full justify-between py-1 relative text-foreground select-none">
        
        {/* 1. 전체 포트폴리오 요약 헤더 (Header Summary Bar) */}
        {summary && (
          <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900/60 to-zinc-950/80 p-2.5 rounded-xl border border-amber-500/20 mb-2.5 shadow-md">
            <div className="flex justify-between items-center pb-1.5 mb-1.5 border-b border-white/10">
              <span className="text-[10px] font-extrabold text-amber-300 flex items-center gap-1 tracking-wide uppercase">
                <PieChart className="w-3.5 h-3.5" />
                <span>포트폴리오 총 자산 요약</span>
              </span>
              <button 
                onClick={() => refetch()} 
                className="text-muted-foreground hover:text-white transition-colors p-0.5"
                title="실시간 시세 새로고침"
              >
                <RefreshCw className={`w-3 h-3 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="flex flex-col">
                <span className="text-[8.5px] text-muted-foreground">총 투자금액</span>
                <span className="text-[11px] font-bold text-foreground truncate">
                  {formatCurrency(summary.total_invested)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8.5px] text-muted-foreground">현재 평가금액</span>
                <span className="text-[11px] font-extrabold text-amber-300 truncate">
                  {formatCurrency(summary.total_evaluated)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8.5px] text-muted-foreground">총 손익</span>
                <span className={`text-[11px] truncate ${getProfitColorClass(summary.total_profit_loss)}`}>
                  {summary.total_profit_loss > 0 ? '+' : ''}{formatCurrency(summary.total_profit_loss)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8.5px] text-muted-foreground">총 수익률</span>
                <span className={`text-[11px] truncate ${getProfitColorClass(summary.total_profit_rate)}`}>
                  {summary.total_profit_rate > 0 ? '+' : ''}{summary.total_profit_rate.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. 보유 종목 카드 리스트 */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground my-auto text-center flex items-center justify-center gap-1.5 py-6">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>포트폴리오 실시간 시세 산출 중...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-destructive my-auto text-center py-6">포트폴리오 정보를 불러올 수 없습니다.</div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[160px] pr-1 mb-2">
            {items && items.length > 0 ? (
              items.map((stock) => {
                const isEditing = editingId === stock.id;
                const isProfit = stock.profit_loss >= 0;

                return (
                  <div 
                    key={stock.id} 
                    className="bg-zinc-900/60 hover:bg-zinc-900/90 p-2.5 rounded-xl border border-white/10 transition-all flex flex-col gap-1.5 group"
                  >
                    {/* 카드 헤더: 종목명, 티커, 액션 버튼 */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-foreground">{stock.name}</span>
                            <span className="text-[9px] bg-white/5 border border-white/10 text-muted-foreground px-1.5 py-0.2 rounded font-mono">
                              {stock.symbol}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 우측 단추 묶음 (차트, 수정, 삭제) */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedStock(selectedStock?.id === stock.id ? null : stock)}
                          className={`text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded transition-all ${
                            selectedStock?.id === stock.id
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white'
                          }`}
                          title="주가 추이 차트"
                        >
                          <LineChart className="w-3 h-3" />
                          <span>차트</span>
                        </button>
                        
                        {!isEditing && (
                          <button
                            onClick={() => startEditing(stock)}
                            className="text-muted-foreground hover:text-amber-300 transition-colors p-1 rounded hover:bg-white/5"
                            title="수량/평단가 수정"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => deleteMutation.mutate(stock.id)}
                          disabled={deleteMutation.isPending}
                          className="text-muted-foreground hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10"
                          title="종목 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 인라인 수정 모드일 때 */}
                    {isEditing ? (
                      <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-amber-500/30 mt-1">
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[9px]">
                            <span className="text-muted-foreground shrink-0">수량(주):</span>
                            <input
                              type="number"
                              step="any"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(e.target.value)}
                              className="w-full bg-zinc-800 border border-white/20 text-xs px-1.5 py-0.5 rounded text-foreground font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div className="flex items-center gap-1 text-[9px]">
                            <span className="text-muted-foreground shrink-0">평단가:</span>
                            <input
                              type="number"
                              step="any"
                              value={editAvgPrice}
                              onChange={(e) => setEditAvgPrice(e.target.value)}
                              className="w-full bg-zinc-800 border border-white/20 text-xs px-1.5 py-0.5 rounded text-foreground font-mono focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleSaveEdit(stock.id)}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 p-1 rounded transition-colors"
                            title="저장"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-muted-foreground p-1 rounded transition-colors"
                            title="취소"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 보유 주식 6대 핵심 지표 그리드 */
                      <div className="grid grid-cols-3 gap-1.5 bg-black/30 p-2 rounded-lg border border-white/5 text-[9.5px]">
                        <div className="flex flex-col">
                          <span className="text-[8px] text-muted-foreground">보유수량 / 평단가</span>
                          <span className="font-semibold text-foreground/90 truncate">
                            {stock.quantity}주 · {formatCurrency(stock.avg_buy_price, stock.symbol)}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[8px] text-muted-foreground">현재가 / 평가금액</span>
                          <span className="font-extrabold text-foreground truncate">
                            {formatCurrency(stock.current_price, stock.symbol)} · <span className="text-amber-300">{formatCurrency(stock.total_evaluated, stock.symbol)}</span>
                          </span>
                        </div>

                        <div className="flex flex-col text-right">
                          <span className="text-[8px] text-muted-foreground">손익 / 수익률</span>
                          <span className={`truncate ${getProfitColorClass(stock.profit_loss)}`}>
                            {stock.profit_loss > 0 ? '+' : ''}{formatCurrency(stock.profit_loss, stock.symbol)} ({stock.profit_rate > 0 ? '+' : ''}{stock.profit_rate.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground py-8 text-center flex flex-col items-center justify-center gap-2">
                <PieChart className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
                <span>등록된 보유 주식이 없습니다. 하단 폼에서 등록해 주세요.</span>
              </div>
            )}
          </div>
        )}

        {/* 📊 3. 선택한 종목의 기간별(1D/1W/1M/3M/1Y) 주가 추이 미니 차트 모달 */}
        {selectedStock && (
          <div className="bg-zinc-950/90 border border-amber-500/30 rounded-xl p-3 mb-2 shadow-xl relative animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <LineChart className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-extrabold text-amber-200">{selectedStock.name} ({selectedStock.symbol}) 추이</span>
              </div>
              
              {/* 기간 탭 스위처 */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10">
                {['1d', '1w', '1m', '3m', '1y'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded uppercase transition-all ${
                      chartRange === r ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSelectedStock(null)}
                className="text-muted-foreground hover:text-white transition-colors p-0.5 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 차트 SVG/Canvas 라인 그래프 렌더링 */}
            {isChartLoading ? (
              <div className="h-20 flex items-center justify-center text-xs text-muted-foreground gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>차트 수집 중...</span>
              </div>
            ) : chartData && chartData.points.length > 0 ? (
              <div className="h-24 w-full pt-1 flex flex-col justify-between">
                <div className="w-full h-16 flex items-end gap-1 relative border-b border-white/10 pb-1">
                  {chartData.points.map((pt, i) => {
                    const prices = chartData.points.map(p => p.price);
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    const range = max - min || 1;
                    const heightPct = Math.max(15, ((pt.price - min) / range) * 100);

                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-amber-400/30 hover:bg-amber-400/80 transition-all rounded-t relative group cursor-pointer"
                        style={{ height: `${heightPct}%` }}
                      >
                        {/* 툴팁 */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col bg-black/90 text-[8px] text-amber-200 px-1.5 py-0.5 rounded border border-amber-500/40 whitespace-nowrap z-50">
                          <span>{pt.timestamp}</span>
                          <span className="font-bold">{pt.price.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[8px] text-muted-foreground pt-1">
                  <span>{chartData.points[0]?.timestamp}</span>
                  <span>{chartData.points[Math.floor(chartData.points.length / 2)]?.timestamp}</span>
                  <span>{chartData.points[chartData.points.length - 1]?.timestamp}</span>
                </div>
              </div>
            ) : (
              <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">차트 데이터를 표시할 수 없습니다.</div>
            )}
          </div>
        )}

        {/* 💡 [실시간 검색 엔진 드롭다운] */}
        {showSuggestions && (
          <div 
            ref={suggestionRef} 
            className="absolute bottom-12 left-0 right-0 bg-zinc-950/95 backdrop-blur-md border border-amber-500/30 rounded-xl shadow-2xl z-50 max-h-[140px] overflow-y-auto"
          >
            {suggestions.map((item) => (
              <div
                key={item.symbol}
                onClick={() => handleSelectSuggestion(item)}
                className="flex items-center justify-between px-3 py-2 text-[10px] text-foreground hover:bg-amber-500/20 cursor-pointer border-b border-white/5 last:border-b-0 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-amber-300">{item.symbol}</span>
                  <span className="text-[9px] text-muted-foreground line-clamp-1">{item.name}</span>
                </div>
                <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground shrink-0 font-bold ml-2">
                  {item.market}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ➕ 4. 하단 신규 보유 종목 등록 폼 (티커, 종목명, 수량, 평균매수가) */}
        <form onSubmit={handleAddStock} className="flex flex-col gap-1.5 pt-2 border-t border-white/10 mt-auto">
          <div className="grid grid-cols-2 gap-1.5">
            <div className="relative">
              <input
                type="text"
                placeholder="티커 검색 (예: NVDA, 삼성)"
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setName('');
                }}
                className="w-full bg-black/40 border border-white/15 text-[10px] rounded-lg px-2 py-1.5 pr-6 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-400/60"
                disabled={addMutation.isPending}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                {isSearching ? (
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                ) : (
                  <Search className="w-3 h-3 text-muted-foreground/60" />
                )}
              </div>
            </div>

            <input
              type="text"
              placeholder="종목명"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/40 border border-white/15 text-[10px] rounded-lg px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-400/60"
              disabled={addMutation.isPending}
            />
          </div>

          <div className="flex gap-1.5 items-center">
            <input
              type="number"
              step="any"
              placeholder="보유 수량(주)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 bg-black/40 border border-white/15 text-[10px] rounded-lg px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-400/60 font-mono"
              disabled={addMutation.isPending}
            />
            <input
              type="number"
              step="any"
              placeholder="평균 매수가($/원)"
              value={avgBuyPrice}
              onChange={(e) => setAvgBuyPrice(e.target.value)}
              className="flex-1 bg-black/40 border border-white/15 text-[10px] rounded-lg px-2 py-1.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-amber-400/60 font-mono"
              disabled={addMutation.isPending}
            />

            <button
              type="submit"
              disabled={addMutation.isPending || !symbol || !name}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all flex items-center justify-center disabled:opacity-40 shrink-0 gap-1 cursor-pointer"
              title="보유 주식 등록"
            >
              {addMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>등록</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </WidgetWrapper>
  );
}
