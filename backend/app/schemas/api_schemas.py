from pydantic import BaseModel
from typing import Optional

class WeatherResponse(BaseModel):
    location: str
    temperature: float
    condition: str
    humidity: int
    wind_speed: float

class StockItem(BaseModel):
    id: Optional[int] = None # 관심 주식 고유 ID
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    quantity: float = 1.0
    avg_buy_price: float = 0.0

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
    type: str
    repo: str
    message: str
    created_at: str

class BriefingResponse(BaseModel):
    """종합 일일 AI 브리핑 스키마"""
    content: str
    created_at: str
