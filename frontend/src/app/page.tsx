'use client';

import React from 'react';
import { DEFAULT_DASHBOARD_LAYOUT, renderWidget } from '@/components/widgets/WidgetRegistry';
import CabinScene from '@/components/cabin/CabinScene';
import { Terminal, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen text-foreground selection:bg-primary/30 overflow-x-hidden">
      
      {/* 🚆 [배경 레이어]: 브라우저 화면 전체를 꽉 채우는 2D 기차 주행 씬 */}
      <CabinScene />

      {/* 🎛️ [전면 대시보드 레이아웃]: 기차 씬 위에 얹혀 스크롤되는 글래스모피즘 위젯 컨테이너 */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        
        {/* 상단 패딩 (기차 HUD 알림판 영역 확보를 위해 여백 확보) */}
        <div className="h-24 sm:h-28" />

        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
          
          {/* 미니 대시보드 헤더 (기차 씬과 자연스럽게 녹아들도록 고스트 스타일 처리) */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between bg-zinc-950/40 backdrop-blur-sm border border-white/5 p-4 rounded-2xl mb-8 gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-foreground via-neutral-200 to-primary bg-clip-text text-transparent">
                  Personal AI OS
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  Train Cabin Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto text-[10px] text-muted-foreground bg-black/60 px-2.5 py-1 rounded-md border border-white/5">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>데스크톱 여정 모드</span>
            </div>
          </header>

          {/* 대시보드 메인 위젯 그리드 (반응형 1열 / 3열 레이아웃) */}
          <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {DEFAULT_DASHBOARD_LAYOUT.map((widget) => (
              <div 
                key={widget.id} 
                className={`${widget.gridSpan} transition-all duration-300 hover:translate-y-[-2px]`}
              >
                {/* 각 위젯을 감싸서 일괄 반투명 Glassmorphism 스타일을 부여 */}
                <div className="bg-zinc-950/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-0.5 overflow-hidden">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </main>
        </div>

        {/* 대시보드 푸터 영역 */}
        <footer className="w-full bg-zinc-950/50 backdrop-blur-sm border-t border-white/5 py-4 text-center text-[9px] text-muted-foreground relative z-20">
          <p>© {new Date().getFullYear()} Personal AI OS Train OS. 모든 권리 보유.</p>
        </footer>
      </div>
    </div>
  );
}
