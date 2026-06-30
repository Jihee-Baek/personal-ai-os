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
