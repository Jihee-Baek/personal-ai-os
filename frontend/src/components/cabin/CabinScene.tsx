'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFromAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CloudSun, Wallet, BookOpen, 
  Newspaper, Laptop, FileText, Radio, 
  MapPin, Milestone, Sparkles, Compass, X, Pin,
  Play, Square, AlertCircle, Train, RotateCcw
} from 'lucide-react';
import TransparentImage from './TransparentImage';
import WeatherParticleOverlay, { WeatherType } from './WeatherParticleOverlay';

// 9대 소품 위젯 컴포넌트 임포트
import DailyBriefingWidget from '../widgets/DailyBriefingWidget';
import CalendarWidget from '../widgets/CalendarWidget';
import StocksWidget from '../widgets/StocksWidget';
import ExchangeWidget from '../widgets/ExchangeWidget';
import GitHubWidget from '../widgets/GitHubWidget';
import MemoWidget from '../widgets/MemoWidget';
import WeatherWidget from '../widgets/WeatherWidget';
import AIChatWidget from '../widgets/AIChatWidget';

// 위젯 타입 정의
type WidgetType = 'briefing' | 'chat' | 'weather' | 'exchange' | 'stocks' | 'todos' | 'memos' | 'github' | 'dashboard';

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

// 🛡️ 런타임 세이프티 가드용 기본값 정의
const DEFAULT_ICON_POSITIONS: Record<WidgetType, { x: number; y: number }> = {
  weather: { x: 32, y: 110 },
  todos: { x: 32, y: 171 },
  stocks: { x: 32, y: 233 },
  exchange: { x: 32, y: 294 },
  briefing: { x: 32, y: 355 },
  chat: { x: 32, y: 416 },
  github: { x: 32, y: 478 },
  dashboard: { x: 32, y: 539 },
  memos: { x: 32, y: 600 },
};

const DEFAULT_PINNED_WIDGETS: Record<WidgetType, boolean> = {
  briefing: false,
  chat: false,
  weather: false,
  exchange: false,
  stocks: false,
  todos: false,
  memos: false,
  github: false,
  dashboard: false,
};

const DEFAULT_WIDGET_POSITIONS: Record<WidgetType, { x: number; y: number }> = {
  briefing: { x: 50, y: 120 },
  chat: { x: 100, y: 200 },
  weather: { x: 120, y: 100 },
  exchange: { x: 80, y: 300 },
  stocks: { x: 400, y: 150 },
  todos: { x: 640, y: 190 },
  memos: { x: 30, y: 300 },
  github: { x: 540, y: 200 },
  dashboard: { x: 350, y: 150 },
};

export default function CabinScene() {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | 'dawn'>('afternoon');
  const [currentTimeText, setCurrentTimeText] = useState('');
  
  // 활성화된 모달 팝업 상태
  const [activeWidget, setActiveWidget] = useState<WidgetType | null>(null);

  // 1. 압정 핀 고정 위젯 및 좌표 상태 (기본값 설정)
  const [pinnedWidgets, setPinnedWidgets] = useState<Record<WidgetType, boolean>>(DEFAULT_PINNED_WIDGETS);
  const [widgetPositions, setWidgetPositions] = useState<Record<WidgetType, { x: number; y: number }>>(DEFAULT_WIDGET_POSITIONS);

  // 2. 사물 소품(아이콘) 자체의 드래그 누적 좌표 상태 (기본값 설정)
  const [iconPositions, setIconPositions] = useState<Record<WidgetType, { x: number; y: number }>>(DEFAULT_ICON_POSITIONS);

  // 3. 출근/퇴근 상태 관리 및 근무 시간 측정 변수
  const [isCommuted, setIsCommuted] = useState<boolean>(false); // 출근 여부
  const [isOffWork, setIsOffWork] = useState<boolean>(false);   // 퇴근 여부
  const [workSeconds, setWorkSeconds] = useState<number>(0);     // 누적 근무 초

  // 4. 로컬 시간대에 따른 명암 조절, 타이머 째깍거림 및 로컬스토리지 복원 (병합 안전 가드 포함)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      setCurrentTimeText(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

      if (hours >= 6 && hours < 11) {
        setTimeOfDay('morning');
      } else if (hours >= 11 && hours < 17) {
        setTimeOfDay('afternoon');
      } else if (hours >= 17 && hours < 20) {
        setTimeOfDay('evening');
      } else if (hours >= 20 && hours < 24) {
        setTimeOfDay('night');
      } else {
        setTimeOfDay('dawn');
      }

      // 출근 상태이고 아직 퇴근을 누르지 않았다면 누적 근무 초 증가
      setIsCommuted(prevCommuted => {
        setIsOffWork(prevOffWork => {
          if (prevCommuted && !prevOffWork) {
            setWorkSeconds(sec => {
              const updatedSec = sec + 1;
              localStorage.setItem('cabin_work_seconds', updatedSec.toString());
              return updatedSec;
            });
          }
          return prevOffWork;
        });
        return prevCommuted;
      });
    }, 1000);

    // 로컬스토리지 복원
    try {
      const savedPins = localStorage.getItem('cabin_pinned_widgets');
      const savedPositions = localStorage.getItem('cabin_widget_positions');
      const savedIcons = localStorage.getItem('cabin_icon_positions');

      if (savedPins) {
        setPinnedWidgets({
          ...DEFAULT_PINNED_WIDGETS,
          ...JSON.parse(savedPins)
        });
      }
      if (savedPositions) {
        setWidgetPositions({
          ...DEFAULT_WIDGET_POSITIONS,
          ...JSON.parse(savedPositions)
        });
      }
      if (savedIcons) {
        setIconPositions({
          ...DEFAULT_ICON_POSITIONS,
          ...JSON.parse(savedIcons)
        });
      }

      const savedCommute = localStorage.getItem('cabin_is_commuted');
      const savedOffWork = localStorage.getItem('cabin_is_off_work');
      const savedSeconds = localStorage.getItem('cabin_work_seconds');

      if (savedCommute) setIsCommuted(savedCommute === 'true');
      if (savedOffWork) setIsOffWork(savedOffWork === 'true');
      if (savedSeconds) setWorkSeconds(parseInt(savedSeconds, 10));
    } catch (e) {
      console.error("로컬스토리지 상태 복원 실패 (기본값 작동):", e);
    }

    return () => clearInterval(interval);
  }, []);

  // 5. 출퇴근 조작 핸들러
  const handleCommute = () => {
    setIsCommuted(true);
    setIsOffWork(false);
    localStorage.setItem('cabin_is_commuted', 'true');
    localStorage.setItem('cabin_is_off_work', 'false');
  };

  const handleOffWork = () => {
    setIsOffWork(true);
    localStorage.setItem('cabin_is_off_work', 'true');
  };

  // 6. 누적 근무 초 포맷터
  const formatWorkTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}시간 ${m}분 ${s}초`;
  };

  // 7. 실시간 업무 주행률 계산 (08:00 ~ 17:00 기준)
  const getWorkProgress = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = 8 * 60; 
    const endMinutes = 17 * 60;  

    if (currentMinutes < startMinutes) return 0;
    if (currentMinutes > endMinutes) return 100;

    const total = endMinutes - startMinutes;
    const elapsed = currentMinutes - startMinutes;
    return (elapsed / total) * 100;
  };

  // 8. 야근(Extra) 운행 시간 계산
  const getExtraTimeText = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const endMinutes = 17 * 60; 

    if (currentMinutes > endMinutes && isCommuted && !isOffWork) {
      const extraMinutes = currentMinutes - endMinutes;
      const h = Math.floor(extraMinutes / 60);
      const m = extraMinutes % 60;
      return `야근 주행 중 (+${h}시간 ${m}분)`;
    }
    return null;
  };

  // 9. 압정 핀 토글 함수
  const togglePin = (type: WidgetType) => {
    const updatedPins = {
      ...pinnedWidgets,
      [type]: !pinnedWidgets[type]
    };
    setPinnedWidgets(updatedPins);
    localStorage.setItem('cabin_pinned_widgets', JSON.stringify(updatedPins));

    if (updatedPins[type]) {
      setActiveWidget(null);
    }
  };

  // 10. 위젯 드래그 종료
  const handleWidgetDragEnd = (type: WidgetType, info: any) => {
    const currentPos = widgetPositions[type] || DEFAULT_WIDGET_POSITIONS[type];
    const updatedPositions = {
      ...widgetPositions,
      [type]: {
        x: currentPos.x + info.offset.x,
        y: currentPos.y + info.offset.y
      }
    };
    setWidgetPositions(updatedPositions);
    localStorage.setItem('cabin_widget_positions', JSON.stringify(updatedPositions));
  };

  // 11. 사물 소품 아이콘 드래그 종료
  const handleIconDragEnd = (type: WidgetType, info: any) => {
    const currentPos = iconPositions[type] || DEFAULT_ICON_POSITIONS[type];
    const updatedIcons = {
      ...iconPositions,
      [type]: {
        x: currentPos.x + info.offset.x,
        y: currentPos.y + info.offset.y
      }
    };
    setIconPositions(updatedIcons);
    localStorage.setItem('cabin_icon_positions', JSON.stringify(updatedIcons));
  };

  // 12. 🧹 배치 및 핀 상태 초기화
  const resetLayout = () => {
    setIconPositions(DEFAULT_ICON_POSITIONS);
    localStorage.setItem('cabin_icon_positions', JSON.stringify(DEFAULT_ICON_POSITIONS));

    setPinnedWidgets(DEFAULT_PINNED_WIDGETS);
    localStorage.setItem('cabin_pinned_widgets', JSON.stringify(DEFAULT_PINNED_WIDGETS));

    setWidgetPositions(DEFAULT_WIDGET_POSITIONS);
    localStorage.setItem('cabin_widget_positions', JSON.stringify(DEFAULT_WIDGET_POSITIONS));
  };

  // 12.5. 날씨 연동 실시간 Weather API 데이터 로드
  const { data: weatherData } = useQuery<{ condition: string }>({
    queryKey: ['weather'],
    queryFn: () => fetchFromAPI('/weather'),
    refetchInterval: 15 * 60 * 1000, // 15분 마다 백엔드 날씨 데이터 갱신
  });

  // 날씨 조건 문자열 파싱하여 4대 상태로 표준 정규화
  const getWeatherCondition = (): WeatherType => {
    if (!weatherData?.condition) return 'Clear';
    const cond = weatherData.condition.toLowerCase();
    
    if (cond.includes('비') || cond.includes('실비') || cond.includes('소나기') || cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
      return 'Rainy';
    }
    if (cond.includes('눈') || cond.includes('진눈깨비') || cond.includes('snow') || cond.includes('sleet')) {
      return 'Snowy';
    }
    if (cond.includes('흐림') || cond.includes('구름') || cond.includes('안개') || cond.includes('박무') || cond.includes('연무') || cond.includes('cloud') || cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) {
      return 'Cloudy';
    }
    return 'Clear';
  };

  const weatherCondition = getWeatherCondition();

  // 날씨에 맞춰 창밖 Parallax 풍경의 명도/채도/필터 제어
  const getWindowFilter = () => {
    switch (weatherCondition) {
      case 'Rainy':
        return 'brightness(0.35) saturate(0.65) contrast(1.1) hue-rotate(15deg)'; // 우중충한 파란 톤
      case 'Snowy':
        return 'brightness(0.75) grayscale(0.45) contrast(0.9)'; // 희뿌연 화이트아웃 톤
      case 'Cloudy':
        return 'brightness(0.5) grayscale(0.5) contrast(0.95)'; // 어두운 회색 톤
      case 'Clear':
      default:
        return 'brightness(0.9) saturate(1.0) contrast(1.0)'; // 원본 유지
    }
  };

  // 날씨와 시간에 따라 유기적으로 반응하는 실내 조명 톤 (오버레이)
  const getLightingOverlay = () => {
    // 1순위: 악천후에 따른 조도 보정
    if (weatherCondition === 'Rainy') {
      return 'bg-indigo-950/25 mix-blend-multiply'; // 비오는 날 어두운 침침함
    }
    if (weatherCondition === 'Cloudy') {
      return 'bg-slate-800/15 mix-blend-multiply'; // 흐린 날 뿌연 어두움
    }

    // 2순위: 맑을 때 시간대별 객실 색조
    switch (timeOfDay) {
      case 'morning':
        return 'bg-amber-500/10 mix-blend-color-burn'; 
      case 'afternoon':
        return 'bg-transparent'; 
      case 'evening':
        return 'bg-rose-500/15 mix-blend-color-burn'; 
      case 'night':
        return 'bg-indigo-950/30 mix-blend-multiply'; 
      case 'dawn':
        return 'bg-purple-900/20 mix-blend-multiply'; 
    }
  };

  // 13. 팝업 생성 원점(Origin) 좌표 매핑 (안전 가드 주입)
  const getWidgetOriginPx = (type: WidgetType | null): string => {
    if (!type) return '50% 50%';
    const pos = iconPositions[type] || DEFAULT_ICON_POSITIONS[type];
    return `${pos.x}px ${pos.y}px`;
  };

  const isTrainMoving = isCommuted && !isOffWork;
  const journeyProgress = getWorkProgress();
  const extraTimeText = getExtraTimeText();

  // 14. ⏱️ 팝업 및 고정 위젯 전용 출퇴근 운행 제어판 마크업
  const renderDashboardWidget = () => {
    return (
      <div className="flex flex-col gap-4 text-foreground p-1 select-none">
        
        {/* 상태 정보 */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Train className={`w-4 h-4 text-primary ${isTrainMoving ? 'animate-bounce' : ''}`} />
            <span className="text-xs font-bold">
              {isCommuted ? (isOffWork ? '💼 운행 종료 (퇴근)' : '🚆 주행 중 (업무 여정)') : '💤 운행 대기 (출근 전)'}
            </span>
          </div>
          
          {/* 야근 시간 경고 */}
          {extraTimeText && (
            <div className="flex items-center gap-1 bg-rose-500/20 text-rose-300 text-[9px] font-extrabold px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
              <AlertCircle className="w-3 h-3" />
              <span>야근</span>
            </div>
          )}
        </div>

        {/* 8:00 ~ 17:00 근무 여정 게이지 */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>08:00 출근</span>
            <span>17:00 퇴근</span>
          </div>
          <div className="w-full h-3 bg-zinc-800/80 rounded-full overflow-hidden border border-white/5 relative">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out ${isTrainMoving ? 'bg-gradient-to-r from-primary/80 to-primary animate-[pulse_2s_infinite]' : 'bg-zinc-700'}`}
              style={{ width: `${journeyProgress}%` }}
            />
          </div>
          <div className="text-[9px] text-muted-foreground text-right mt-0.5">
            일과 진행율: {journeyProgress.toFixed(1)}%
          </div>
        </div>

        {/* 타이머 및 조작판 */}
        <div className="flex flex-col gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">누적 근무 시간</span>
            <span className="text-sm font-extrabold text-amber-400 tabular-nums">
              {formatWorkTime(workSeconds)}
            </span>
          </div>
          {extraTimeText && (
            <div className="text-[10px] text-rose-300 font-extrabold text-right">
              {extraTimeText}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button 
              onClick={handleCommute}
              disabled={isCommuted && !isOffWork}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                isCommuted && !isOffWork 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent' 
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 cursor-pointer'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>출근 (출발)</span>
            </button>
            <button 
              onClick={handleOffWork}
              disabled={!isCommuted || isOffWork}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                !isCommuted || isOffWork 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-transparent' 
                  : 'bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 cursor-pointer'
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>퇴근 (정차)</span>
            </button>
          </div>
        </div>

        {/* 소품 위치 초기화 보조 단추 */}
        <button 
          onClick={resetLayout}
          className="flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-muted-foreground hover:text-foreground py-1.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>사물 배치 초기화 (Reset)</span>
        </button>

      </div>
    );
  };

  // 15. 위젯 분기 렌더링 헬퍼
  const renderWidgetContent = (type: WidgetType | null) => {
    switch (type) {
      case 'dashboard': return renderDashboardWidget();
      case 'briefing': return <DailyBriefingWidget />;
      case 'todos': return <CalendarWidget />;
      case 'stocks': return <StocksWidget />;
      case 'exchange': return <ExchangeWidget />;
      case 'github': return <GitHubWidget />;
      case 'memos': return <MemoWidget />;
      case 'weather': return <WeatherWidget />;
      case 'chat': return <AIChatWidget />;
      default: return null;
    }
  };

  const getWidgetTitle = (type: WidgetType | null): string => {
    switch (type) {
      case 'dashboard': return '🎫 기차 운행 및 출퇴근 제어판';
      case 'briefing': return '📻 AI 일일 브리핑';
      case 'todos': return '📖 다이어리 일정 및 할 일';
      case 'stocks': return '📰 주식 관심 종목 시황';
      case 'exchange': return '🛂 여행 여권 환율 정보';
      case 'github': return '💻 실시간 개발 활동로그';
      case 'memos': return '🟨 포스트잇 노트 메모';
      case 'weather': return '🌤️ 창밖 오늘의 날씨';
      case 'chat': return '✨ AI 정령 대화 비서';
      default: return '위젯';
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-neutral-950 overflow-hidden select-none z-0">
      
      {/* 🖼️ 중앙 2D 기차 객실 일러스트 메인 프레임 */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center">
        <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
          
          {/* 기차 객실 일러스트 컨테이너 (3:2 비율 유지 cover) */}
          <div className="w-full h-full min-w-full min-h-full relative aspect-[3/2] bg-cover bg-center" style={{ backgroundImage: `url('/train_cabin_bg.png')` }}>
            
            {/* 🏙️ [레이어 1]: 창문 영역 뒤 빌딩 실루엣 (Parallax 및 날씨 오버레이 통합) */}
            <div className="absolute top-[4.5%] left-[12.2%] w-[59.3%] h-[62.5%] overflow-hidden z-0 bg-sky-950">
              <div 
                className="w-[200%] h-full bg-cover bg-repeat-x animate-[scrollLandscape_65s_linear_infinite]"
                style={{ 
                  backgroundImage: `url('/sky_city_scenery.jpg')`,
                  animationPlayState: isTrainMoving ? 'running' : 'paused',
                  filter: getWindowFilter()
                }}
              />
              
              {/* 🌧️❄️☀️ 실시간 날씨 연동 Canvas 파티클 오버레이 레이어 도킹 */}
              <WeatherParticleOverlay 
                condition={weatherCondition} 
                isTrainMoving={isTrainMoving} 
              />

              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 mix-blend-overlay pointer-events-none" />
            </div>

            {/* 🛋️ [레이어 2]: 창문 뚫림 PNG 배경 */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-10 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.4)]"
              style={{ backgroundImage: `url('/train_cabin_bg.png')` }}
            />

            {/* 🎛️ [레이어 3]: 드래그 및 클릭이 가능한 9대 사물 소품 아이콘 */}
            
            {/* 1. 벽시계 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('weather', info)}
              onClick={() => {
                if (!pinnedWidgets['weather']) setActiveWidget('weather');
              }}
              style={{ 
                x: iconPositions['weather']?.x ?? DEFAULT_ICON_POSITIONS.weather.x, 
                y: iconPositions['weather']?.y ?? DEFAULT_ICON_POSITIONS.weather.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="벽시계 (시간/날씨)"
            >
              <Clock className="w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors" />
              <span className="text-[7px] text-amber-300 font-extrabold mt-0.5 tracking-tight">
                {currentTimeText}
              </span>
            </motion.div>

            {/* 2. 다이어리 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('todos', info)}
              onClick={() => {
                if (!pinnedWidgets['todos']) setActiveWidget('todos');
              }}
              style={{ 
                x: iconPositions['todos']?.x ?? DEFAULT_ICON_POSITIONS.todos.x, 
                y: iconPositions['todos']?.y ?? DEFAULT_ICON_POSITIONS.todos.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="다이어리 수첩"
            >
              <BookOpen className="w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors" />
            </motion.div>

            {/* 3. 신문 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('stocks', info)}
              onClick={() => {
                if (!pinnedWidgets['stocks']) setActiveWidget('stocks');
              }}
              style={{ 
                x: iconPositions['stocks']?.x ?? DEFAULT_ICON_POSITIONS.stocks.x, 
                y: iconPositions['stocks']?.y ?? DEFAULT_ICON_POSITIONS.stocks.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="주식 신문"
            >
              <Newspaper className="w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors" />
            </motion.div>

            {/* 4. 여권 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('exchange', info)}
              onClick={() => {
                if (!pinnedWidgets['exchange']) setActiveWidget('exchange');
              }}
              style={{ 
                x: iconPositions['exchange']?.x ?? DEFAULT_ICON_POSITIONS.exchange.x, 
                y: iconPositions['exchange']?.y ?? DEFAULT_ICON_POSITIONS.exchange.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="환율 정보 여권"
            >
              <Wallet className="w-5 h-5 text-amber-300/70 group-hover:text-amber-100 transition-colors" />
            </motion.div>

            {/* 5. 라디오 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('briefing', info)}
              onClick={() => {
                if (!pinnedWidgets['briefing']) setActiveWidget('briefing');
              }}
              style={{ 
                x: iconPositions['briefing']?.x ?? DEFAULT_ICON_POSITIONS.briefing.x, 
                y: iconPositions['briefing']?.y ?? DEFAULT_ICON_POSITIONS.briefing.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group relative"
              title="라디오 브리핑"
            >
              <Radio className="w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors" style={{ animationPlayState: isTrainMoving ? 'running' : 'paused' }} />
              <span className="absolute text-[8px] top-0 right-1.5 animate-[musicNotes_2.5s_ease-in-out_infinite] font-extrabold text-amber-400 font-mono" style={{ display: isTrainMoving ? 'block' : 'none' }}>♪</span>
            </motion.div>

            {/* 6. AI 정령 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('chat', info)}
              onClick={() => {
                if (!pinnedWidgets['chat']) setActiveWidget('chat');
              }}
              style={{ 
                x: iconPositions['chat']?.x ?? DEFAULT_ICON_POSITIONS.chat.x, 
                y: iconPositions['chat']?.y ?? DEFAULT_ICON_POSITIONS.chat.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="AI 정령 비서"
            >
              <Sparkles className="w-5 h-5 text-amber-300/70 group-hover:text-amber-100 animate-pulse transition-colors" />
            </motion.div>

            {/* 7. 노트북 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('github', info)}
              onClick={() => {
                if (!pinnedWidgets['github']) setActiveWidget('github');
              }}
              style={{ 
                x: iconPositions['github']?.x ?? DEFAULT_ICON_POSITIONS.github.x, 
                y: iconPositions['github']?.y ?? DEFAULT_ICON_POSITIONS.github.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="개발 로그 (노트북)"
            >
              <Laptop className="w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors" />
            </motion.div>

            {/* 8. 포스트잇 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('memos', info)}
              onClick={() => {
                if (!pinnedWidgets['memos']) setActiveWidget('memos');
              }}
              style={{ 
                x: iconPositions['memos']?.x ?? DEFAULT_ICON_POSITIONS.memos.x, 
                y: iconPositions['memos']?.y ?? DEFAULT_ICON_POSITIONS.memos.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="포스트잇 노트"
            >
              <FileText className="w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors" />
            </motion.div>

            {/* 🚆 9. 기차 운행 계기판 소품 */}
            <motion.div 
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragEnd={(_, info) => handleIconDragEnd('dashboard', info)}
              onClick={() => {
                if (!pinnedWidgets['dashboard']) setActiveWidget('dashboard');
              }}
              style={{ 
                x: iconPositions['dashboard']?.x ?? DEFAULT_ICON_POSITIONS.dashboard.x, 
                y: iconPositions['dashboard']?.y ?? DEFAULT_ICON_POSITIONS.dashboard.y 
              }}
              className="absolute z-30 cursor-grab active:cursor-grabbing w-12 h-12 bg-amber-950/20 backdrop-blur-md border border-amber-500/25 rounded-2xl flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6),_inset_0_1px_1px_rgba(255,255,255,0.08)] hover:border-amber-400/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-all group"
              title="운행 계기판 (출퇴근)"
            >
              <Train className={`w-5 h-5 text-amber-200/70 group-hover:text-amber-100 transition-colors ${isTrainMoving ? 'animate-bounce' : ''}`} style={{ animationDuration: '1.5s' }} />
            </motion.div>

            {/* 📌📌📌 [레이어 4]: 압정으로 고정(Pin) 위젯 카드 레이어 📌📌📌 */}
            {Object.entries(pinnedWidgets).map(([key, isPinned]) => {
              if (!isPinned) return null;
              const type = key as WidgetType;
              const pos = widgetPositions[type] || DEFAULT_WIDGET_POSITIONS[type];
              return (
                <motion.div
                  key={`pinned-${type}`}
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  onDragEnd={(_, info) => handleWidgetDragEnd(type, info)}
                  style={{ x: pos.x, y: pos.y }}
                  className="absolute z-40 w-full max-w-sm bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-black/40">
                    <span className="text-[10px] font-bold text-foreground">
                      {getWidgetTitle(type)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => togglePin(type)}
                        className="text-primary hover:text-muted-foreground transition-colors p-0.5"
                        title="고정 해제 (Unpin)"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          const updatedPins = { ...pinnedWidgets, [type]: false };
                          setPinnedWidgets(updatedPins);
                          localStorage.setItem('cabin_pinned_widgets', JSON.stringify(updatedPins));
                        }}
                        className="text-muted-foreground hover:text-white transition-colors p-0.5"
                        title="닫기"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3.5 max-h-[280px] overflow-y-auto">
                    {renderWidgetContent(type)}
                  </div>
                </motion.div>
              );
            })}

            {/* 🌓 [조명 필터] */}
            <div className={`absolute inset-0 z-25 pointer-events-none transition-colors duration-[4000ms] ${getLightingOverlay()}`} />
          </div>
        </div>
      </div>

      {/* 🍿🍿🍿 2단계: 쫀득한 팝업 카드 위젯 렌더링 레이어 (AnimatePresence) 🍿🍿🍿 */}
      <AnimatePresence>
        {activeWidget && (
          <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center p-4">
            
            {/* 배경 흐릿한 오버레이 블러 (클릭 시 닫힘) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveWidget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
            />

            {/* 통통 튀어 올라오는 스프링 모달 카드 */}
            <motion.div
              initial={{ scale: 0.05, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                transition: { type: 'spring', stiffness: 350, damping: 24 } 
              }}
              exit={{ 
                scale: 0.05, 
                opacity: 0, 
                transition: { duration: 0.22, ease: 'easeInOut' } 
              }}
              style={{
                transformOrigin: getWidgetOriginPx(activeWidget),
              }}
              className="relative w-full max-w-lg bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto z-10"
            >
              {/* 카드 상단 헤더 */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/30">
                <span className="text-xs font-extrabold text-foreground tracking-wide">
                  {getWidgetTitle(activeWidget)}
                </span>
                
                <div className="flex items-center gap-3">
                  {/* 압정 핀 */}
                  <button 
                    onClick={() => togglePin(activeWidget)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    title="대시보드에 고정 (Pin)"
                  >
                    <Pin className="w-3.5 h-3.5 rotate-45" />
                  </button>
                  {/* 닫기 버튼 */}
                  <button 
                    onClick={() => setActiveWidget(null)}
                    className="text-muted-foreground hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                    title="닫기 (ESC)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 실제 위젯 콘텐츠 바디 */}
              <div className="p-4 max-h-[480px] overflow-y-auto">
                {renderWidgetContent(activeWidget)}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
