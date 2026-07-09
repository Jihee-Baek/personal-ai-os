'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchFromAPI } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, CloudSun, Wallet, BookOpen, 
  Newspaper, Laptop, FileText, Radio, 
  MapPin, Milestone, Sparkles, Compass, X, Pin
} from 'lucide-react';
import TransparentImage from './TransparentImage';

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
type WidgetType = 'briefing' | 'chat' | 'weather' | 'exchange' | 'stocks' | 'todos' | 'memos' | 'github';

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
}

export default function CabinScene() {
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night' | 'dawn'>('afternoon');
  const [currentTimeText, setCurrentTimeText] = useState('');
  
  // 활성화된 팝업 위젯 상태
  const [activeWidget, setActiveWidget] = useState<WidgetType | null>(null);
  
  // 1. 로컬 시간대에 따른 명암 조절
  useEffect(() => {
    const updateTime = () => {
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
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 2. 시간대별 객실 내부 조명 톤 (오버레이)
  const getLightingOverlay = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'bg-amber-500/10 mix-blend-color-burn'; // 따뜻한 아침 빛
      case 'afternoon':
        return 'bg-transparent'; // 맑은 조도
      case 'evening':
        return 'bg-rose-500/15 mix-blend-color-burn'; // 짙은 저녁 노을빛
      case 'night':
        return 'bg-indigo-950/30 mix-blend-multiply'; // 어두운 밤 빛
      case 'dawn':
        return 'bg-purple-900/20 mix-blend-multiply'; // 푸르스름한 새벽 빛
    }
  };

  // 3. 기차 여정 진행도 게이지용 Todo 연동
  const { data: todos } = useQuery<TodoItem[]>({
    queryKey: ['todos'],
    queryFn: () => fetchFromAPI('/todos'),
  });

  const totalTodos = todos?.length || 0;
  const completedTodos = todos?.filter(t => t.completed).length || 0;
  const journeyProgress = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;
  const distanceCovered = completedTodos * 15.4;

  // 4. 각 위젯별 원점(Origin) 좌표 매핑 (팝업이 튀어나오고 빨려 들어가는 중심점)
  const getWidgetOrigin = (type: WidgetType | null): string => {
    switch (type) {
      case 'weather': // 창문
        return '35% 30%';
      case 'todos': // 다이어리
        return '68% 76%';
      case 'stocks': // 신문
        return '49% 76%';
      case 'exchange': // 여권
        return '39% 76%';
      case 'briefing': // 라디오
        return '85% 78%';
      case 'chat': // 정령
        return '47% 88%';
      case 'github': // 주인공 소녀가 앉아있는 구역
        return '70% 60%';
      case 'memos': // 포스트잇 벽면
        return '10% 40%';
      default:
        return '50% 50%';
    }
  };

  // 5. 팝업창 안에서 렌더링될 실제 위젯 분기 핸들러
  const renderPopupContent = () => {
    switch (activeWidget) {
      case 'briefing':
        return <DailyBriefingWidget />;
      case 'todos':
        return <CalendarWidget />;
      case 'stocks':
        return <StocksWidget />;
      case 'exchange':
        return <ExchangeWidget />;
      case 'github':
        return <GitHubWidget />;
      case 'memos':
        return <MemoWidget />;
      case 'weather':
        return <WeatherWidget />;
      case 'chat':
        return <AIChatWidget />;
      default:
        return null;
    }
  };

  // 위젯 타이틀 한글 매핑
  const getWidgetTitle = (type: WidgetType | null): string => {
    switch (type) {
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
            
            {/* 🏙️ [레이어 1]: 창문 영역 뒤에서 가로로 천천히 흐르는 도시 야경 (Parallax) */}
            <div className="absolute top-[4.5%] left-[12.2%] w-[59.3%] h-[62.5%] overflow-hidden z-0 bg-sky-950">
              <div 
                className="w-[200%] h-full bg-cover bg-repeat-x animate-[scrollLandscape_65s_linear_infinite]"
                style={{ backgroundImage: `url('/sky_city_scenery.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 mix-blend-overlay pointer-events-none" />
            </div>

            {/* 🛋️ [레이어 2]: 창문 뚫림 PNG 배경 (소녀와 가구 배치 포함) */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat z-10 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.4)]"
              style={{ backgroundImage: `url('/train_cabin_bg.png')` }}
            />

            {/* 📻 [인터랙티브 소품 레이어 3]: absolute 클릭 반응형 소품 구역 */}
            
            {/* 1. 벽시계 (시간) */}
            <div 
              onClick={() => setActiveWidget('weather')}
              className="absolute left-[6.5%] top-[10%] w-[9%] aspect-square rounded-full z-30 cursor-pointer hover:shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all flex flex-col items-center justify-center text-center group"
              title="현재 시간 & 날씨"
            >
              <Clock className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
              <span className="text-[9px] text-amber-300 font-extrabold mt-0.5 bg-zinc-950/70 px-1 py-0.2 rounded-md border border-white/5 transition-all group-hover:scale-105">
                {currentTimeText}
              </span>
            </div>

            {/* 2. 다이어리 (일정/할일) */}
            <div 
              onClick={() => setActiveWidget('todos')}
              className="absolute left-[64%] bottom-[19%] w-[9%] h-[6%] z-30 cursor-pointer hover:bg-indigo-500/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded border border-transparent hover:border-indigo-400 transition-all flex items-center justify-center group"
              title="일정 다이어리"
            >
              <BookOpen className="w-4 h-4 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* 3. 신문 (주식 관심종목) */}
            <div 
              onClick={() => setActiveWidget('stocks')}
              className="absolute left-[45%] bottom-[18%] w-[8%] h-[6%] z-30 cursor-pointer hover:bg-rose-500/10 hover:shadow-[0_0_15px_rgba(244,63,94,0.5)] rounded border border-transparent hover:border-rose-400 transition-all flex items-center justify-center group"
              title="주식 신문"
            >
              <Newspaper className="w-3.5 h-3.5 text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* 4. 여권/지갑 (주요환율) */}
            <div 
              onClick={() => setActiveWidget('exchange')}
              className="absolute left-[36%] bottom-[18.5%] w-[7%] h-[6%] z-30 cursor-pointer hover:bg-amber-500/10 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] rounded border border-transparent hover:border-amber-400 transition-all flex items-center justify-center group"
              title="환율 정보 여권"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* 5. 라디오 (AI 브리핑) */}
            <div 
              onClick={() => setActiveWidget('briefing')}
              className="absolute left-[81%] bottom-[13%] w-[9%] h-[12%] z-30 cursor-pointer hover:bg-amber-500/10 hover:shadow-[0_0_20px_rgba(251,191,36,0.6)] rounded-lg border border-transparent hover:border-amber-500 transition-all flex items-center justify-center group"
              title="AI 라디오 브리핑"
            >
              <Radio className="w-4 h-4 text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute text-[9px] top-[-8px] right-2 animate-[musicNotes_2.5s_ease-in-out_infinite] font-extrabold text-amber-400">♪</span>
            </div>

            {/* 6. 정령 비서 (AI 비서 대화) */}
            <div 
              onClick={() => setActiveWidget('chat')}
              className="absolute left-[45%] bottom-[5%] w-[10%] h-[11%] z-30 cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] rounded-full transition-all border border-transparent hover:border-sky-400/20"
              title="AI 동반자 정령"
            />

            {/* 7. 주인공 소녀 (GitHub 활동로그 - 노트북/카드기기 조작 은유) */}
            <div 
              onClick={() => setActiveWidget('github')}
              className="absolute left-[54%] bottom-[20%] w-[20%] h-[50%] z-30 cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] rounded-2xl border border-transparent hover:border-purple-400/20"
              title="개발 활동로그 (GitHub)"
            />

            {/* 8. 포스트잇 벽면 (메모) */}
            <div 
              onClick={() => setActiveWidget('memos')}
              className="absolute left-[3%] top-[30%] w-[10%] h-[20%] z-30 cursor-pointer hover:bg-yellow-500/5 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)] rounded-lg border border-transparent hover:border-yellow-400/20"
              title="포스트잇 메모지"
            />

            {/* 🌓 [조명 필터] */}
            <div className={`absolute inset-0 z-25 pointer-events-none transition-colors duration-[4000ms] ${getLightingOverlay()}`} />
          </div>
        </div>
      </div>

      {/* 🚉 최상단 플로팅 기차 여정 HUD 대시보드 */}
      <div className="fixed top-6 left-6 right-6 z-30 flex items-center justify-between bg-zinc-950/75 backdrop-blur-lg border border-white/10 px-5 py-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[11px] text-muted-foreground font-semibold">현재 정차역:</span>
          <span className="text-xs font-bold text-foreground">
            {journeyProgress === 100 ? '🎉 종착역 (여정 완료)' : `🚉 Station - ${completedTodos}번역`}
          </span>
        </div>

        <div className="flex-1 max-w-[280px] mx-6 relative hidden sm:block">
          <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${journeyProgress}%` }}
            />
          </div>
          <span 
            className="absolute text-xs top-[-11px] transition-all duration-1000 ease-out"
            style={{ left: `calc(${journeyProgress}% - 8px)` }}
          >
            🚆
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Milestone className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold text-foreground">{distanceCovered.toFixed(1)} km 이동</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg text-[10px] text-muted-foreground font-bold border border-white/5">
            <Compass className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '10s' }} />
            <span>{timeOfDay.toUpperCase()}</span>
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
                transformOrigin: getWidgetOrigin(activeWidget),
              }}
              className="relative w-full max-w-lg bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto z-10"
            >
              {/* 카드 상단 헤더 */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/30">
                <span className="text-xs font-extrabold text-foreground tracking-wide">
                  {getWidgetTitle(activeWidget)}
                </span>
                
                <div className="flex items-center gap-3">
                  {/* 압정 핀 (3단계에서 고정 기능 활성화 예정) */}
                  <button 
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
                {renderPopupContent()}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
