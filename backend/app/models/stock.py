from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class UserStock(Base):
    """
    사용자가 등록한 관심 주식 종목을 저장하는 SQLAlchemy 모델
    """
    __tablename__ = "user_stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True) # 주식 티커/심볼 (예: "005930.KS", "AAPL")
    name = Column(String(100), nullable=False) # 종목 명칭 (예: "삼성전자", "애플")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
