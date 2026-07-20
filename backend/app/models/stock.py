from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class UserStock(Base):
    """
    사용자가 등록한 보유 주식 포트폴리오 종목을 저장하는 SQLAlchemy 모델
    """
    __tablename__ = "user_stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True) # 티커 (예: "NVDA", "005930.KS")
    name = Column(String(100), nullable=False) # 종목명 (예: "NVIDIA", "삼성전자")
    quantity = Column(Float, nullable=False, default=1.0) # 보유 수량 (주)
    avg_buy_price = Column(Float, nullable=False, default=0.0) # 평균 매수가 (1주당 가격)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
