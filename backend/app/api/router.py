import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import pandas as pd
import httpx

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
from app.schemas.stock_schemas import (
    StockCreate, StockUpdate, StockResponse, StockPortfolioResponse, StockChartResponse
)

from app.services.ai_service import AIService
from app.services.weather_service import WeatherService
from app.services.finance_service import FinanceService
from app.services.github_service import GitHubService
from app.services.briefing_service import BriefingService

logger = logging.getLogger(__name__)

router = APIRouter()
ai_service = AIService()
weather_service = WeatherService()
finance_service = FinanceService()
github_service = GitHubService()
briefing_service = BriefingService(ai_service, weather_service, finance_service, github_service)

# ----------------- 날씨 API -----------------

@router.get("/weather", response_model=WeatherResponse)
def get_weather():
    """실시간 서울 날씨 정보를 반환하는 API"""
    logger.info("GET /weather 호출됨")
    return weather_service.get_current_weather()

# ----------------- 외환 환율 API -----------------

@router.get("/exchange", response_model=List[ExchangeItem])
def get_exchange():
    """실시간 외환 환율 고시 정보를 반환하는 API"""
    logger.info("GET /exchange 호출됨")
    return finance_service.get_realtime_exchange()

# ----------------- 주식 포트폴리오 및 시세 API -----------------

@router.get("/stocks", response_model=StockPortfolioResponse)
def get_stocks(db: Session = Depends(get_db)):
    """DB에 등록된 보유 주식 종목들의 실시간 가격 및 평가금액, 손익, 수익률 계산 데이터 반환"""
    logger.info("GET /stocks 호출됨 (보유 주식 포트폴리오 실시간 산출)")
    
    db_stocks = db.query(UserStock).order_by(UserStock.created_at.asc()).all()
    
    stock_payload = [
        {
            "id": s.id,
            "symbol": s.symbol,
            "name": s.name,
            "quantity": s.quantity,
            "avg_buy_price": s.avg_buy_price
        } 
        for s in db_stocks
    ]
    
    return finance_service.get_portfolio_data(stock_payload)

# 🇰🇷 한국거래소(KRX) 상장법인 실시간 마스터 데이터 메모리 캐시
_krx_cache: List[Dict[str, Any]] = []

def _load_krx_cache():
    """대한민국 정부 한국거래소(KRX) 상장법인 공식 마스터 리스트를 다운로드하여 메모리에 캐싱"""
    global _krx_cache
    if _krx_cache:
        return
    try:
        logger.info("KRX 캐시 적재 시작 - 한국거래소 상장사 목록 다운로드 중...")
        url = "http://kind.krx.co.kr/corpgeneral/corpList.do?method=download"
        df = pd.read_html(url, header=0, encoding="cp949")[0]
        
        temp_list = []
        for _, row in df.iterrows():
            code = str(row["종목코드"]).zfill(6)
            name = str(row["회사명"])
            temp_list.append({
                "symbol": f"{code}.KS",
                "name": name,
                "market": "KOSPI/KOSDAQ"
            })
        _krx_cache = temp_list
        logger.info("KRX 캐시 적재 완료 - 총 %d개 한국 주식 상장사 동적 로드 성공", len(_krx_cache))
    except Exception as e:
        logger.error("KRX 상장사 마스터 다운로드 및 파싱 실패: %s", str(e))
        _krx_cache = []

@router.get("/stocks/search")
def search_stocks(q: str):
    """한국거래소 실시간 상장사 목록과 야후 파이낸스 글로벌 API를 병합해 실시간 검색"""
    logger.info("GET /stocks/search 호출됨 - 검색어: '%s'", q)
    if not q or not q.strip():
        return []
        
    query = q.strip().lower()
    results = []
    seen_symbols = set()
    
    try:
        _load_krx_cache()
        if _krx_cache:
            for stock in _krx_cache:
                if query in stock["name"].lower() or query in stock["symbol"].lower():
                    results.append(stock)
                    seen_symbols.add(stock["symbol"])
    except Exception as krx_e:
        logger.error("GET /stocks/search KRX 캐시 필터링 중 오류: %s", str(krx_e))
        
    is_korean = any(ord('가') <= ord(char) <= ord('힣') for char in query)
    
    if not is_korean:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        yahoo_url = "https://query1.finance.yahoo.com/v1/finance/search"
        query_params = {
            "q": query,
            "quotesCount": 8
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(yahoo_url, params=query_params, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    quotes = data.get("quotes", [])
                    for quote_item in quotes:
                        if quote_item.get("quoteType") == "EQUITY":
                            symbol = quote_item.get("symbol", "")
                            if symbol in seen_symbols or symbol.replace(".KS", "") in seen_symbols:
                                continue
                                
                            name = quote_item.get("longname") or quote_item.get("shortname") or symbol
                            exchange = quote_item.get("exchange", "Unknown")
                            
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
                            seen_symbols.add(symbol)
                else:
                    logger.error("GET /stocks/search 야후 API 실패 - 상태코드: %d", res.status_code)
        except Exception as yahoo_e:
            logger.error("GET /stocks/search 야후 API 추가 조회 실패: %s", str(yahoo_e))
            
    final_results = results[:8]
    logger.info("GET /stocks/search 최종 반환 결과: %d건", len(final_results))
    return final_results

@router.post("/stocks", response_model=StockResponse)
def create_stock(payload: StockCreate, db: Session = Depends(get_db)):
    """새로운 보유 주식 종목 추가 (티커, 종목명, 수량, 평균매수가)"""
    logger.info("POST /stocks 호출됨 - 심볼: '%s', 수량: %.2f, 평단가: %.2f", payload.symbol, payload.quantity, payload.avg_buy_price)
    
    exists = db.query(UserStock).filter(UserStock.symbol == payload.symbol).first()
    if exists:
        logger.warning("POST /stocks 실패 - 이미 등록된 주식 기호: %s", payload.symbol)
        raise HTTPException(status_code=400, detail="이미 포트폴리오에 등록되어 있는 티커입니다.")
        
    db_stock = UserStock(
        symbol=payload.symbol,
        name=payload.name,
        quantity=payload.quantity,
        avg_buy_price=payload.avg_buy_price
    )
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    logger.info("보유 주식 추가 완료: ID=%d, 심볼=%s", db_stock.id, db_stock.symbol)
    return db_stock

@router.put("/stocks/{stock_id}", response_model=StockResponse)
def update_stock(stock_id: int, payload: StockUpdate, db: Session = Depends(get_db)):
    """보유 주식 수량 및 평균 매수가 수정"""
    logger.info("PUT /stocks/%d 호출됨 - quantity: %s, avg_buy_price: %s", stock_id, payload.quantity, payload.avg_buy_price)
    
    db_stock = db.query(UserStock).filter(UserStock.id == stock_id).first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="해당 보유 주식을 찾을 수 없습니다.")
        
    if payload.quantity is not None:
        db_stock.quantity = payload.quantity
    if payload.avg_buy_price is not None:
        db_stock.avg_buy_price = payload.avg_buy_price
        
    db.commit()
    db.refresh(db_stock)
    logger.info("보유 주식 수정 완료: ID=%d, 심볼=%s", db_stock.id, db_stock.symbol)
    return db_stock

@router.delete("/stocks/{stock_id}")
def delete_stock(stock_id: int, db: Session = Depends(get_db)):
    """보유 주식 종목 삭제"""
    logger.info("DELETE /stocks/%d 호출됨", stock_id)
    db_stock = db.query(UserStock).filter(UserStock.id == stock_id).first()
    if not db_stock:
        logger.warning("DELETE /stocks/%d 실패 - 종목을 찾을 수 없음", stock_id)
        raise HTTPException(status_code=404, detail="보유 종목을 찾을 수 없습니다.")
        
    db.delete(db_stock)
    db.commit()
    logger.info("보유 주식 삭제 완료: ID=%d", stock_id)
    return {"message": "보유 종목이 성공적으로 삭제되었습니다."}

@router.get("/stocks/{symbol}/chart", response_model=StockChartResponse)
def get_stock_chart(symbol: str, range: str = "1m"):
    """특정 티커 종목의 기간별(1d, 1w, 1m, 3m, 1y) 주가 추이 차트 데이터 제공"""
    logger.info("GET /stocks/%s/chart 호출됨 - range: %s", symbol, range)
    return finance_service.get_stock_chart(symbol, range)

# ----------------- TODO (일정 관리) DB CRUD API -----------------

@router.get("/todos", response_model=List[TodoResponse])
def get_todos(db: Session = Depends(get_db)):
    logger.info("GET /todos 호출됨")
    return db.query(Todo).order_by(Todo.created_at.desc()).all()

@router.post("/todos", response_model=TodoResponse)
def create_todo(payload: TodoCreate, db: Session = Depends(get_db)):
    logger.info("POST /todos 호출됨 - 제목: '%s'", payload.title)
    db_todo = Todo(
        title=payload.title,
        completed=payload.completed,
        due_date=payload.due_date
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo(todo_id: int, payload: TodoUpdate, db: Session = Depends(get_db)):
    logger.info("PUT /todos/%d 호출됨", todo_id)
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="할 일 항목을 찾을 수 없습니다.")
        
    if payload.title is not None:
        db_todo.title = payload.title
    if payload.completed is not None:
        db_todo.completed = payload.completed
    if payload.due_date is not None:
        db_todo.due_date = payload.due_date
        
    db.commit()
    db.refresh(db_todo)
    return db_todo

@router.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    logger.info("DELETE /todos/%d 호출됨", todo_id)
    db_todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="할 일 항목을 찾을 수 없습니다.")
        
    db.delete(db_todo)
    db.commit()
    return {"message": "할 일이 성공적으로 삭제되었습니다."}

# ----------------- 메모 (Post-it Note) DB CRUD API -----------------

@router.get("/memos", response_model=List[MemoResponse])
def get_memos(db: Session = Depends(get_db)):
    logger.info("GET /memos 호출됨")
    return db.query(Memo).order_by(Memo.created_at.desc()).all()

@router.post("/memos", response_model=MemoResponse)
def create_memo(payload: MemoCreate, db: Session = Depends(get_db)):
    logger.info("POST /memos 호출됨")
    db_memo = Memo(
        content=payload.content,
        color=payload.color
    )
    db.add(db_memo)
    db.commit()
    db.refresh(db_memo)
    return db_memo

@router.delete("/memos/{memo_id}")
def delete_memo(memo_id: int, db: Session = Depends(get_db)):
    logger.info("DELETE /memos/%d 호출됨", memo_id)
    db_memo = db.query(Memo).filter(Memo.id == memo_id).first()
    if not db_memo:
        raise HTTPException(status_code=404, detail="메모 항목을 찾을 수 없습니다.")
        
    db.delete(db_memo)
    db.commit()
    return {"message": "메모가 성공적으로 삭제되었습니다."}

# ----------------- AI 대화 및 브리핑 API -----------------

@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(payload: ChatRequest):
    logger.info("POST /chat 호출됨 - 메시지: '%s'", payload.message)
    reply, provider = ai_service.chat(payload.message, payload.provider)
    return ChatResponse(reply=reply, provider=provider)

@router.get("/github/events", response_model=List[GitHubEventItem])
def get_github_events():
    logger.info("GET /github/events 호출됨")
    return github_service.get_user_events()

@router.get("/briefing", response_model=BriefingResponse)
def get_daily_briefing(db: Session = Depends(get_db)):
    logger.info("GET /briefing 호출됨")
    content = briefing_service.generate_daily_briefing(db)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return BriefingResponse(content=content, created_at=now_str)
