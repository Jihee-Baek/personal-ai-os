'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WidgetWrapper } from './WidgetWrapper';
import { fetchFromAPI } from '@/lib/api';
import { Calendar, CheckCircle, Circle, Plus, Trash2, Loader2 } from 'lucide-react';

interface TodoItem {
  id: number;
  title: string;
  completed: boolean;
  due_date?: string;
}

export default function CalendarWidget() {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  // 1. 미완료 및 전체 할 일 목록 조회
  const { data, isLoading, error } = useQuery<TodoItem[]>({
    queryKey: ['todos'],
    queryFn: () => fetchFromAPI('/todos'),
  });

  // 2. 일정 추가 뮤테이션
  const addMutation = useMutation({
    mutationFn: (newTodo: { title: string; completed: boolean; due_date?: string }) =>
      fetchFromAPI('/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
      setNewTitle('');
      setDueDate('');
    },
    onError: (err: any) => {
      alert(err.message || '일정 추가에 실패했습니다.');
    },
  });

  // 3. 일정 완료 체크 토글 뮤테이션
  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      fetchFromAPI(`/todos/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
    },
  });

  // 4. 일정 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      fetchFromAPI(`/todos/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['briefing'] });
    },
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('일정 내용을 입력해 주세요.');
      return;
    }
    addMutation.mutate({
      title: newTitle.trim(),
      completed: false,
      due_date: dueDate.trim() || undefined,
    });
  };

  return (
    <WidgetWrapper title="일정 및 할 일 관리">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">오늘 예정된 일정</span>
          </div>
          {data && (
            <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-bold">
              미완료 {data.filter(t => !t.completed).length}건
            </span>
          )}
        </div>
        
        {/* 할 일 목록 뷰 영역 */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground my-auto flex items-center justify-center gap-1.5 py-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>일정 목록을 가져오는 중...</span>
          </div>
        ) : error ? (
          <div className="text-xs text-destructive my-auto py-4">일정 목록을 불러오지 못했습니다.</div>
        ) : (
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[90px] pr-1 mb-2">
            {data && data.length > 0 ? (
              data.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between bg-muted/40 p-2 rounded-md border border-border/10 group">
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {/* 체크 토글 버튼 */}
                    <button
                      onClick={() => toggleMutation.mutate({ id: todo.id, completed: !todo.completed })}
                      disabled={toggleMutation.isPending}
                      className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {todo.completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <span className={`text-xs truncate ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                      {todo.title}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {todo.due_date && (
                      <span className="text-[9px] text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded">
                        {todo.due_date}
                      </span>
                    )}
                    {/* 일정 삭제 버튼 */}
                    <button
                      onClick={() => deleteMutation.mutate(todo.id)}
                      disabled={deleteMutation.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded hover:bg-destructive/10"
                      title="일정 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">오늘 예정된 할 일이 없습니다.</div>
            )}
          </div>
        )}

        {/* 할 일 입력 폼 영역 */}
        <form onSubmit={handleAddTodo} className="flex gap-1.5 items-center pt-2 border-t border-border/10 mt-auto">
          <input
            type="text"
            placeholder="할 일 입력 (예: 개발 미팅)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-[2] bg-muted/40 border border-border/20 text-[10px] rounded px-1.5 py-1 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
            disabled={addMutation.isPending}
          />
          <input
            type="text"
            placeholder="기한 (예: 오늘, 19시)"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 bg-muted/40 border border-border/20 text-[10px] rounded px-1.5 py-1 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50"
            disabled={addMutation.isPending}
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="bg-primary hover:bg-primary/95 text-primary-foreground p-1 rounded transition-colors flex items-center justify-center disabled:opacity-50 shrink-0"
            title="새 일정 추가"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </WidgetWrapper>
  );
}
