from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class StockCreate(BaseModel):
    """보유 주식 종목 추가 요청 스키마"""
    symbol: str # 티커 (예: "NVDA", "005930.KS")
    name: str # 종목명 (예: "NVIDIA", "삼성전자")
    quantity: float = Field(default=1.0, ge=0.0001, description="보유 수량 (주)")
    avg_buy_price: float = Field(default=0.0, ge=0.0, description="평균 매수가 (1주당 가격)")

class StockUpdate(BaseModel):
    """보유 주식 수량/평단가 수정 요청 스키마"""
    quantity: Optional[float] = Field(default=None, ge=0.0001, description="보유 수량 (주)")
    avg_buy_price: Optional[float] = Field(default=None, ge=0.0, description="평균 매수가 (1주당 가격)")

class StockResponse(BaseModel):
    """보유 주식 DB 기본 응답 스키마"""
    id: int
    symbol: str
    name: str
    quantity: float
    avg_buy_price: float
    created_at: datetime

    class Config:
        from_attributes = True

class PortfolioSummary(BaseModel):
    """전체 포트폴리오 요약 헤더 데이터"""
    total_invested: float # 총 매수 금액 ($/원)
    total_evaluated: float # 현재 총 평가 금액 ($/원)
    total_profit_loss: float # 총 손익 ($/원)
    total_profit_rate: float # 총 수익률 (%)

class StockPortfolioItem(BaseModel):
    """개별 보유 종목 계산 지표 및 실시간 시황"""
    id: int
    symbol: str
    name: str
    quantity: float
    avg_buy_price: float
    current_price: float
    change: float
    change_percent: float
    total_invested: float # 종목별 총 매수 금액
    total_evaluated: float # 종목별 현재 평가 금액
    profit_loss: float # 종목별 평가 손익
    profit_rate: float # 종목별 수익률 (%)

class StockPortfolioResponse(BaseModel):
    """포트폴리오 최종 반환 스키마 (요약 + 개별종목들)"""
    summary: PortfolioSummary
    items: List[StockPortfolioItem]

class StockChartPoint(BaseModel):
    """주가 차트 시간별/일별 포인트 데이터"""
    timestamp: str
    price: float

class StockChartResponse(BaseModel):
    """기간별 차트 응답 스키마"""
    symbol: str
    range: str
    points: List[StockChartPoint]
