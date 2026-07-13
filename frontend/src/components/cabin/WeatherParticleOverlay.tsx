'use client';

import React, { useRef, useEffect } from 'react';

// 날씨 분류 타입
export type WeatherType = 'Clear' | 'Rainy' | 'Snowy' | 'Cloudy';

interface WeatherParticleOverlayProps {
  condition: WeatherType;
  isTrainMoving: boolean;
}

interface Particle {
  x: number;
  y: number;
  speed: number;
  length?: number;     // 빗줄기 길이
  size?: number;       // 눈송이 크기
  opacity: number;
  angle: number;       // 떨어지는 각도
  wobble?: number;     // 눈송이 살랑살랑 흔들림
  wobbleSpeed?: number;
}

interface GlassDroplet {
  x: number;
  y: number;
  size: number;
  opacity: number;
  trail: { x: number; y: number }[]; // 흘러내린 자국
  isSliding: boolean;
  slideSpeed: number;
}

export default function WeatherParticleOverlay({ condition, isTrainMoving }: WeatherParticleOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let glassDroplets: GlassDroplet[] = []; // 창문에 맺히는 빗방울
    
    // 캔버스 크기를 컨테이너 크기에 밀착시킴
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 200;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 파티클 초기화
    const initParticles = () => {
      particles = [];
      glassDroplets = [];
      
      const count = condition === 'Rainy' ? 120 : condition === 'Snowy' ? 80 : 0;
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - 20,
          speed: Math.random() * 5 + (condition === 'Rainy' ? 12 : 1.5),
          length: condition === 'Rainy' ? Math.random() * 12 + 15 : undefined,
          size: condition === 'Snowy' ? Math.random() * 2 + 1.2 : undefined,
          opacity: Math.random() * 0.4 + 0.3,
          angle: condition === 'Rainy' ? (isTrainMoving ? 75 : 90) : 90,
          wobble: Math.random() * Math.PI,
          wobbleSpeed: Math.random() * 0.02 + 0.01,
        });
      }

      // 비오는 날 창문에 맺힌 물방울 생성
      if (condition === 'Rainy') {
        const dropletCount = 25;
        for (let i = 0; i < dropletCount; i++) {
          glassDroplets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 1.5 + 1.2,
            opacity: Math.random() * 0.5 + 0.4,
            trail: [],
            isSliding: Math.random() > 0.6,
            slideSpeed: Math.random() * 0.6 + 0.2
          });
        }
      }
    };
    initParticles();

    // 렌더 프레임 루프
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (condition === 'Rainy') {
        // 🌧️ 1. 하늘에서 떨어지는 빗줄기 그리기
        ctx.strokeStyle = 'rgba(174, 219, 240, 0.45)';
        ctx.lineWidth = 1;
        
        particles.forEach((p) => {
          ctx.beginPath();
          
          // 기차가 달릴 때의 사선 바람 각도 적용
          const windAngle = isTrainMoving ? Math.PI / 6 : 0; // 30도 또는 0도
          const dx = Math.sin(windAngle) * (p.length || 15);
          const dy = Math.cos(windAngle) * (p.length || 15);

          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - dx, p.y + dy);
          ctx.stroke();

          // 빗줄기 떨어지는 속도 및 흐름 갱신
          p.y += p.speed;
          if (isTrainMoving) {
            p.x -= p.speed * 0.4; // 기차가 달리면 빗방울이 왼쪽 뒤로 흘러감
          }

          // 화면 탈출 시 리스폰
          if (p.y > canvas.height || p.x < -20) {
            p.y = -20;
            p.x = Math.random() * (canvas.width + 100);
            p.speed = Math.random() * 5 + 12;
          }
        });

        // ☔ 2. 유리창에 맺혀 흐르는 물방울 그리기 (감성 디테일)
        glassDroplets.forEach((d) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${d.opacity})`;
          ctx.strokeStyle = `rgba(0, 0, 0, ${d.opacity * 0.2})`;
          ctx.lineWidth = 0.5;

          // 빗방울 몸체
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 빗방울 흘러내림 모션 (기차 속도 저항 감안)
          if (d.isSliding) {
            d.y += d.slideSpeed;
            if (isTrainMoving) {
              d.x -= d.slideSpeed * 0.25; // 바람 저항으로 옆으로 기우뚱
            }

            // 흔적(Trail) 기록
            if (Math.random() > 0.7) {
              d.trail.push({ x: d.x, y: d.y });
              if (d.trail.length > 8) d.trail.shift();
            }

            // 하단 도달 시 최상단으로 리스폰
            if (d.y > canvas.height || d.x < -10) {
              d.y = -5;
              d.x = Math.random() * (canvas.width + 50);
              d.trail = [];
              d.isSliding = Math.random() > 0.5;
            }
          }

          // 흘러내린 자국 선 그리기
          if (d.trail.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity * 0.25})`;
            ctx.lineWidth = d.size * 0.6;
            ctx.moveTo(d.trail[0].x, d.trail[0].y);
            for (let j = 1; j < d.trail.length; j++) {
              ctx.lineTo(d.trail[j].x, d.trail[j].y);
            }
            ctx.stroke();
          }
        });

      } else if (condition === 'Snowy') {
        // ❄️ 3. 펄펄 날리는 눈송이 그리기
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
          ctx.fill();

          // 눈송이 흔들림 계산
          if (p.wobble !== undefined && p.wobbleSpeed !== undefined) {
            p.wobble += p.wobbleSpeed;
            
            // 기차가 움직이면 바람 저항 때문에 뒤쪽으로 빠르게 날아가고, 멈추면 살랑살랑 하강
            const windShift = isTrainMoving ? -p.speed * 1.8 : Math.sin(p.wobble) * 0.4;
            p.x += windShift;
          }
          
          p.y += p.speed * (isTrainMoving ? 0.75 : 0.6);

          // 화면 탈출 시 리스폰
          if (p.y > canvas.height || p.x < -20 || p.x > canvas.width + 20) {
            p.y = -10;
            p.x = Math.random() * (canvas.width + (isTrainMoving ? 150 : 0));
            p.speed = Math.random() * 1.2 + 0.8;
          }
        });

      } else if (condition === 'Clear') {
        // ☀️ 4. 맑은 날: 창문을 가로지르는 은은한 빛줄기(Godray) 오버레이
        ctx.fillStyle = 'rgba(251, 191, 36, 0.035)'; // 초극소 앰버 그라데이션
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvas.width * 0.45, 0);
        ctx.lineTo(canvas.width * 0.9, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // 갓레이 2
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.25, 0);
        ctx.lineTo(canvas.width * 0.65, 0);
        ctx.lineTo(canvas.width, canvas.height * 0.95);
        ctx.lineTo(canvas.width * 0.4, canvas.height);
        ctx.closePath();
        ctx.fill();
        
      } else if (condition === 'Cloudy') {
        // 🌫️ 5. 흐림/안개: 화면 전체를 덮는 자욱한 안개 필터
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, 'rgba(120, 130, 140, 0.08)');
        grad.addColorStop(1, 'rgba(100, 110, 120, 0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [condition, isTrainMoving]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
