'use client';

import React, { useEffect, useState } from 'react';

interface TransparentImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

/**
 * AI 이미지의 순백색(#ffffff) 배경 픽셀만 실시간으로 완전 투명화(Alpha=0)하여
 * 투명 배경 PNG처럼 solid하게 렌더링해 주는 헬퍼 컴포넌트
 */
export default function TransparentImage({ src, ...props }: TransparentImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      // 흰색에 가까운 픽셀들(#f5f5f5 이상)을 완전 투명(Alpha = 0)으로 치환
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        // Pure White 및 그에 아주 가까운 외곽 영역 필터링
        if (r > 240 && g > 240 && b > 240) {
          data[i+3] = 0; // 투명화
        }
      }
      ctx.putImageData(imgData, 0, 0);
      setDataUrl(canvas.toDataURL());
    };
  }, [src]);

  // 로딩 전에는 투명한 레이아웃 형태 유지
  return dataUrl ? (
    <img src={dataUrl} {...props} alt={props.alt || 'game asset'} />
  ) : (
    <div className={props.className} style={{ width: props.width, height: props.height }} />
  );
}
