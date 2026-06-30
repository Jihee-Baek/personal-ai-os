'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { Calendar, CheckCircle } from 'lucide-react';

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  due_date?: string;
}

export default function CalendarWidget() {
  const { data, isLoading, error } = useQuery<TodoItem[]>({
    queryKey: ['todos'],
    queryFn: () => fetchFromAPI('/todos'),
  });

  return (
    <WidgetWrapper title="일정 및 할 일 관리">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">오늘 예정된 일정</span>
        </div>
        
        {isLoading ? (
          <div className="text-xs text-muted-foreground my-auto">일정을 불러오는 중...</div>
        ) : error ? (
          <div className="text-xs text-destructive my-auto">일정 목록 로드 실패</div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[100px] pr-1">
            {data && data.length > 0 ? (
              data.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md border border-border/10">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle className={`w-4 h-4 shrink-0 ${todo.completed ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className={`text-xs truncate ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {todo.title}
                    </span>
                  </div>
                  {todo.due_date && (
                    <span className="text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded shrink-0 ml-2">
                      {todo.due_date}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-4 text-center">오늘 예정된 일정이 없습니다.</div>
            )}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
