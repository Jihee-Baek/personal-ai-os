'use client';

import React from 'react';
import CabinScene from '@/components/cabin/CabinScene';

export default function Home() {
  return (
    <div className="relative min-h-screen text-foreground selection:bg-primary/30 overflow-hidden bg-black">
      
      {/* 🚆 [기차 여행 OS 메인 씬] 
          배경 주행 씬 렌더링 및 9대 소품 클릭 시 쫀득한 팝업 가동, 
          그리고 고정(Pin) 위젯 관리까지 단일 씬 안에서 일원화하여 제어합니다.
          기존에 정적으로 항상 화면을 가리고 떠 있던 고정 위젯 그리드는 완전히 소멸되었습니다.
      */}
      <CabinScene />

    </div>
  );
}
