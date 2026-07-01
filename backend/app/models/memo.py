from sqlalchemy import Column, Integer, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Memo(Base):
    """
    빠른 메모를 관리하는 SQLAlchemy 데이터베이스 모델
    """
    __tablename__ = "memos"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False) # 메모 본문 내용 (필수 항목)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
