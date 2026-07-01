from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MemoBase(BaseModel):
    content: str

class MemoCreate(MemoBase):
    pass

class MemoUpdate(BaseModel):
    content: Optional[str] = None

class MemoResponse(MemoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True # ORM 객체 매핑 지원 (Pydantic v2)
