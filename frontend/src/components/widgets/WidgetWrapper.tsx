import React from 'react';
import { cn } from '@/lib/utils';

interface WidgetWrapperProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

export function WidgetWrapper({ title, className, children }: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/60 backdrop-blur-md p-5 flex flex-col shadow-xl transition-all duration-300 hover:shadow-primary/5 hover:border-primary/30 h-full min-h-[180px]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
        <h3 className="font-semibold text-sm tracking-wide text-foreground/80">{title}</h3>
      </div>
      <div className="flex-1 flex flex-col justify-between">{children}</div>
    </div>
  );
}
