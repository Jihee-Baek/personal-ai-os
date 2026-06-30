'use client';

import React from 'react';
import { DEFAULT_DASHBOARD_LAYOUT, renderWidget } from '@/components/widgets/WidgetRegistry';
import { Terminal, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-neutral-950 to-black text-foreground selection:bg-primary/30">
      {/* 백그라운드 글로우 이펙트 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* 대시보드 헤더 영역 */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border/50 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-neutral-200 to-primary bg-clip-text text-transparent">
                Personal AI OS
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                개인화 맞춤형 AI 업무 운영체제 대시보드
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto text-xs text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>데모 모드 동작 중</span>
          </div>
        </header>

        {/* 대시보드 메인 위젯 그리드 (반응형 1열 / 3열 레이아웃) */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEFAULT_DASHBOARD_LAYOUT.map((widget) => (
            <div key={widget.id} className={widget.gridSpan}>
              {renderWidget(widget)}
            </div>
          ))}
        </main>

        {/* 대시보드 푸터 영역 */}
        <footer className="mt-16 border-t border-border/30 pt-6 text-center text-[10px] text-muted-foreground">
          <p>© {new Date().getFullYear()} Personal AI OS. 모든 권리 보유.</p>
        </footer>
      </div>
    </div>
  );
}
