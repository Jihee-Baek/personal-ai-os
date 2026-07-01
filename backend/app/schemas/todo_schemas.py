from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

# 허용되는 11가지 반복 타입 정의
RecurrenceType = Literal[
    '시간', '매일', '평일', '주말', '매주', 
    '격주', '매월', '3개월마다', '6개월마다', '매년', '없음'
]

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    completed: bool = False
    due_date: Optional[str] = None
    recurrence: RecurrenceType = "없음"

class TodoCreate(TodoBase):
    pass

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[str] = None
    recurrence: Optional[RecurrenceType] = None

class TodoResponse(TodoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # SQLAlchemy ORM 객체 자동 매핑 지원 (Pydantic v2 방식)
