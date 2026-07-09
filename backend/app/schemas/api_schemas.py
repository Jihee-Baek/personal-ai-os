from pydantic import BaseModel
from typing import Optional

class WeatherResponse(BaseModel):
    location: str
    temperature: float
    condition: str
    humidity: int
    wind_speed: float

class StockItem(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float

class ExchangeItem(BaseModel):
    currency: str
    rate: float
    change: float
    change_percent: float

class TodoItem(BaseModel):
    id: int
    title: str
    completed: bool
    due_date: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    provider: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    provider: str

class GitHubEventItem(BaseModel):
    """GitHub 사용자 활동 로그 스키마"""
    type: str # 이벤트 종류 (예: PushEvent, PR 등)
    repo: str # 관련 레포지토리명
    message: str # 상세 요약 내용 (예: 커밋 메시지)
    created_at: str # 발생 시각

class BriefingResponse(BaseModel):
    """종합 일일 AI 브리핑 스키마"""
    content: str # AI가 분석 요약한 한글 리포트
    created_at: str # 생성 일시
