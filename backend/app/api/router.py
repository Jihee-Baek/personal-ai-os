import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.todo import Todo
from app.models.memo import Memo
from app.models.stock import UserStock
from app.schemas.api_schemas import (
    WeatherResponse, StockItem, ExchangeItem, ChatRequest, ChatResponse,
    GitHubEventItem, BriefingResponse
)
from app.schemas.todo_schemas import TodoCreate, TodoUpdate, TodoResponse
from app.schemas.memo_schemas import MemoCreate, MemoResponse
from app.schemas.stock_schemas import StockCreate, StockResponse

from app.services.ai_service import AIService
from app.services.weather_service import WeatherService
from app.services.finance_service import FinanceService
from app.services.github_service import GitHubService
from app.services.briefing_service import BriefingService

router = APIRouter()
ai_service = AIService()
weather_service = WeatherService()
finance_service = FinanceService()
github_service = GitHubService()
briefing_service = BriefingService(ai_service, weather_service, finance_service, github_service)
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check():
    """백엔드 상태 및 헬스 체크 엔드포인트"""
    logger.info("GET /health 호출됨")
    return {"status": "healthy", "message": "Personal AI OS 백엔드가 성공적으로 가동 중입니다."}

# ----------------- 실시간 외부 날씨 API -----------------

@router.get("/weather", response_model=WeatherResponse)
def get_weather():
    """실시간 서울 날씨 정보 반환 (OpenWeatherMap API 연동)"""
    logger.info("GET /weather 호출됨")
    return weather_service.get_current_weather()

# ----------------- 실시간 외부 환율 API -----------------

@router.get("/exchange", response_model=List[ExchangeItem])
def get_exchange():
    """실시간 주요 원화 환율 정보 반환 (ER-API 연동)"""
    logger.info("GET /exchange 호출됨")
    return finance_service.get_realtime_exchange()

# ----------------- 관심 주식 DB CRUD 및 실시간 시세 API -----------------

@router.get("/stocks", response_model=List[StockItem])
def get_stocks(db: Session = Depends(get_db)):
    """DB에 등록된 관심 종목들의 실시간 주식 가격 정보를 반환 (yfinance 연동)"""
    logger.info("GET /stocks 호출됨 (동적 관심 주식 시황 조회)")
    
    # DB에 저장된 사용자의 관심 주식 심볼 리스트 수집
    db_stocks = db.query(UserStock).order_by(UserStock.created_at.asc()).all()
    
    # 서비스에 전달할 형식인 [{"id": ..., "symbol": ..., "name": ...}] 구조로 변환
    stock_payload = [{"id": s.id, "symbol": s.symbol, "name": s.name} for s in db_stocks]
    
    # 실시간 시세 수집 후 리턴
    return finance_service.get_realtime_stocks(stock_payload)

@router.get("/stocks/search")
def search_stocks(q: str):
    """야후 파이낸스 API를 경유하여 코스피/나스닥 등 전세계 실시간 종목 자동완성 검색"""
    logger.info("GET /stocks/search 호출됨 - 검색어: '%s'", q)
    if not q or not q.strip():
        return []
    try:
        import httpx
        # 야후 파이낸스 Autocomplete 검색 쿼리 전송 (최대 7개)
        url = f"https://query1.finance.yahoo.com/v1/finance/search?q={q.strip()}&quotesCount=7"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        with httpx.Client(timeout=10.0) as client:
            res = client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                quotes = data.get("quotes", [])
                results = []
                for quote in quotes:
                    # EQUITY(주식) 형식의 항목만 안전 필터링
                    if quote.get("quoteType") == "EQUITY":
                        symbol = quote.get("symbol", "")
                        name = quote.get("longname") or quote.get("shortname") or symbol
                        exchange = quote.get("exchange", "Unknown")
                        
                        # 한국 시장 및 미국 시장 구분 태그 매핑
                        market = "NASDAQ/NYSE"
                        if exchange in ["KSC", "KOE", "KOSDAQ"]:
                            market = "KOSPI/KOSDAQ"
                        elif exchange in ["NMS", "NMS/NGS", "NYQ", "ASE"]:
                            market = "NASDAQ/NYSE"
                        else:
                            market = exchange
                            
                        results.append({
                            "symbol": symbol,
                            "name": name,
                            "market": market
                        })
                logger.info("GET /stocks/search 성공: '%s' 검색 결과 %d건 반환", q, len(results))
                return results
    except Exception as e:
        logger.error("GET /stocks/search 주식 동적 검색 중 예외 발생: %s", str(e))
    return []

@router.post("/stocks", response_model=StockResponse)
def create_stock(payload: StockCreate, db: Session = Depends(get_db)):
    """새로운 관심 주식 종목 추가"""
    logger.info("POST /stocks 호출됨 - 심볼: '%s', 종목명: '%s'", payload.symbol, payload.name)
    
    # 중복 체크
    exists = db.query(UserStock).filter(UserStock.symbol == payload.symbol).first()
    if exists:
        logger.warning("POST /stocks 실패 - 이미 등록된 주식 기호: %s", payload.symbol)
        raise HTTPException(status_code=400, detail="이미 관심 종목에 등록되어 있는 티커입니다.")
        
    db_stock = UserStock(
        symbol=payload.symbol,
        name=payload.name
    )
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    logger.info("관심 주식 추가 완료: ID=%d, 심볼=%s", db_stock.id, db_stock.symbol)
    return db_stock

@router.delete("/stocks/{stock_id}")
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    """관심 주식 종목 삭제"""
    logger.info("DELETE /stocks/%d 호출됨", stock_id)
    db_stock = db.query(UserStock).filter(UserStock.id == stock_id).first()
    if not db_stock:
        logger.warning("DELETE /stocks/%d 실패 - 종목을 찾을 수 없음", stock_id)
        raise HTTPException(status_code=404, detail="관심 종목을 찾을 수 없습니다.")
        
    db.delete(db_stock)
    db.commit()
    logger.info("관심 주식 해제 완료: ID=%d", stock_id)
    return {"message": "관심 종목이 성공적으로 해제되었습니다."}

# ----------------- TODO (일정 관리) DB CRUD API -----------------

@router.get("/todos", response_model=List[TodoResponse])
def get_todos(db: Session = Depends(get_db)):
    """DB에서 전체 일정 목록 조회"""
    logger.info("GET /todos 호출됨 (전체 일정 조회)")
    return db.query(Todo).order_by(Todo.created_at.asc()).all()

@router.post("/todos", response_model=TodoResponse)
def create_todo(payload: TodoCreate, db: Session = Depends(get_db)):
    """DB에 새로운 일정 추가"""
    logger.info("POST /todos 호출됨: 제목='%s', 반복='%s'", payload.title, payload.recurrence)
    db_todo = Todo(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        completed=payload.completed,
        due_date=payload.due_date,
        recurrence=payload.recurrence
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    logger.info("새로운 일정 생성 완료: ID=%d", db_todo.id)
    return db_todo

@router.patch("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, payload: TodoUpdate, db: Session = Depends(get_db)):
    """일정 상태 및 필드 정보 수정"""
    logger.info("PATCH /todos/%d 호출됨", todo_id)
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        logger.warning("PATCH /todos/%d 실패: 일정을 찾을 수 없음", todo_id)
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    
    update_data = payload.model_dump(exclude_unset=True)
    logger.info("일정 업데이트 데이터: %s", update_data)
    for key, value in update_data.items():
        setattr(db_todo, key, value)
        
    db.commit()
    db.refresh(db_todo)
    logger.info("일정 업데이트 완료: ID=%d", db_todo.id)
    return db_todo

@router.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    """일정 삭제"""
    logger.info("DELETE /todos/%d 호출됨", todo_id)
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        logger.warning("DELETE /todos/%d 실패: 일정을 찾을 수 없음", todo_id)
        raise HTTPException(status_code=404, detail="일정을 찾을 수 없습니다.")
    db.delete(db_todo)
    db.commit()
    logger.info("일정 삭제 완료: ID=%d", todo_id)
    return {"message": "일정이 성공적으로 삭제되었습니다."}

# ----------------- MEMO (빠른 메모) DB CRUD API -----------------

@router.get("/memos", response_model=List[MemoResponse])
def get_memos(db: Session = Depends(get_db)):
    """전체 메모 목록 조회"""
    logger.info("GET /memos 호출됨 (전체 메모 조회)")
    return db.query(Memo).order_by(Memo.created_at.desc()).all()

@router.post("/memos", response_model=MemoResponse)
def create_memo(payload: MemoCreate, db: Session = Depends(get_db)):
    """새로운 메모 추가"""
    logger.info("POST /memos 호출됨 (메모 길이: %d)", len(payload.content))
    db_memo = Memo(content=payload.content)
    db.add(db_memo)
    db.commit()
    db.refresh(db_memo)
    logger.info("새로운 메모 생성 완료: ID=%d", db_memo.id)
    return db_memo

@router.delete("/memos/{memo_id}")
def delete_memo(memo_id: int, db: Session = Depends(get_db)):
    """메모 삭제"""
    logger.info("DELETE /memos/%d 호출됨", memo_id)
    db_memo = db.query(Memo).filter(Memo.id == memo_id).first()
    if not db_memo:
        logger.warning("DELETE /memos/%d 실패: 메모를 찾을 수 없음", memo_id)
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    db.delete(db_memo)
    db.commit()
    logger.info("메모 삭제 완료: ID=%d", memo_id)
    return {"message": "메모가 성공적으로 삭제되었습니다."}

# ----------------- AI Chat API -----------------

@router.post("/chat", response_model=ChatResponse)
def post_chat(payload: ChatRequest):
    """AI 비서 대화 엔드포인트 (Provider Layer 경유)"""
    provider = payload.provider
    logger.info("POST /chat 호출됨: 프로바이더=%s, 메시지 길이=%d", provider or ai_service.default_provider, len(payload.message))
    try:
        reply = ai_service.chat(payload.message, provider_name=provider)
        logger.info("AI 답변 생성 완료 (길이: %d)", len(reply))
        return ChatResponse(reply=reply, provider=provider or ai_service.default_provider)
    except ValueError as e:
        logger.error("POST /chat 에러 발생: %s", str(e))
        raise HTTPException(status_code=400, detail=str(e))

# ----------------- 실시간 GitHub 최근 활동 API -----------------

@router.get("/github/events", response_model=List[GitHubEventItem])
def get_github_events():
    """GitHub API 연동을 통한 최근 사용자 개발 이벤트 내역 조회"""
    logger.info("GET /github/events 호출됨")
    return github_service.get_recent_events()

# ----------------- 오늘의 AI 종합 브리핑 API -----------------

@router.get("/briefing", response_model=BriefingResponse)
def get_daily_briefing(db: Session = Depends(get_db)):
    """날씨, 환율, 주식, 일정, 메모, GitHub 활동을 종합 요약한 오늘의 브리핑 생성"""
    logger.info("GET /briefing 호출됨 (종합 일일 브리핑 리포트 요청)")
    briefing_content = briefing_service.generate_daily_briefing(db)
    
    # ISO 형식의 타임스탬프로 생성 시각 반환
    current_time_str = datetime.now().isoformat()
    return BriefingResponse(content=briefing_content, created_at=current_time_str)
