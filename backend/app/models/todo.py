from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Todo(Base):
    """
    일정 및 할 일을 관리하는 SQLAlchemy 데이터베이스 모델
    """
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True) # 할 일 상세 설명 (선택 항목)
    location = Column(String(255), nullable=True) # 장소/위치 (선택 항목)
    completed = Column(Boolean, default=False, nullable=False) # 완료 상태 (기본값: False)
    due_date = Column(String(50), nullable=True) # 마감일 (선택 항목)
    recurrence = Column(String(50), default="없음", nullable=False) # 반복 옵션 (기본값: "없음")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
