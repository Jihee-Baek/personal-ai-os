from pydantic import BaseModel
from datetime import datetime

class StockCreate(BaseModel):
    """관심 주식 추가 요청 검증 스키마"""
    symbol: str # 주식 티커 / 심볼 (예: "005930.KS", "AAPL")
    name: str # 종목명 (예: "삼성전자", "애플")

class StockResponse(BaseModel):
    """관심 주식 기본 출력 스키마"""
    id: int
    symbol: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True # ORM 객체 매핑 활성화 (Pydantic v2)
