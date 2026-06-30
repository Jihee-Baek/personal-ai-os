from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.api_schemas import WeatherResponse, StockItem, ExchangeItem, TodoItem, ChatRequest, ChatResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()

@router.get("/health")
def health_check():
    """백엔드 상태 및 헬스 체크 엔드포인트"""
    return {"status": "healthy", "message": "Personal AI OS 백엔드가 성공적으로 가동 중입니다."}

@router.get("/weather", response_model=WeatherResponse)
def get_weather():
    """오늘의 날씨 정보 반환 (한글 더미 데이터)"""
    return WeatherResponse(
        location="서울",
        temperature=24.5,
        condition="맑음",
        humidity=60,
        wind_speed=2.5
    )

@router.get("/stocks", response_model=List[StockItem])
def get_stocks():
    """주식 관심 종목 정보 반환 (한글 더미 데이터)"""
    return [
        StockItem(symbol="005930", name="삼성전자", price=78500.0, change=1200.0, change_percent=1.55),
        StockItem(symbol="035720", name="카카오", price=48200.0, change=-300.0, change_percent=-0.62),
        StockItem(symbol="AAPL", name="애플", price=263500.0, change=3500.0, change_percent=1.35)
    ]

@router.get("/exchange", response_model=List[ExchangeItem])
def get_exchange():
    """실시간 주요 환율 정보 반환 (한글 더미 데이터)"""
    return [
        ExchangeItem(currency="USD", rate=1385.5, change=4.5, change_percent=0.33),
        ExchangeItem(currency="JPY", rate=862.4, change=-2.1, change_percent=-0.24),
        ExchangeItem(currency="EUR", rate=1492.8, change=1.2, change_percent=0.08)
    ]

@router.get("/todos", response_model=List[TodoItem])
def get_todos():
    """오늘의 일정 및 할 일 목록 반환 (한글 더미 데이터)"""
    return [
        TodoItem(id=1, title="AI OS 초기 구조 설계 및 MVP 구축", completed=True, due_date="완료"),
        TodoItem(id=2, title="Docker Compose 다중 컨테이너 연동 테스트", completed=False, due_date="오늘"),
        TodoItem(id=3, title="프로젝트 기술 스택 설명 문서 작성", completed=False, due_date="내일")
    ]

@router.post("/chat", response_model=ChatResponse)
def post_chat(payload: ChatRequest):
    """AI 비서 대화 엔드포인트 (Provider Layer 경유)"""
    provider = payload.provider or "claude"
    try:
        reply = ai_service.chat(payload.message, provider_name=provider)
        return ChatResponse(reply=reply, provider=provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
