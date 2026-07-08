import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.todo import Todo
from app.models.memo import Memo
from app.schemas.api_schemas import WeatherResponse, StockItem, ExchangeItem, ChatRequest, ChatResponse
from app.schemas.todo_schemas import TodoCreate, TodoUpdate, TodoResponse
from app.schemas.memo_schemas import MemoCreate, MemoResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()
logger = logging.getLogger(__name__)

@router.get("/health")
def health_check():
    """백엔드 상태 및 헬스 체크 엔드포인트"""
    logger.info("GET /health 호출됨")
    return {"status": "healthy", "message": "Personal AI OS 백엔드가 성공적으로 가동 중입니다."}

@router.get("/weather", response_model=WeatherResponse)
def get_weather():
    """오늘의 날씨 정보 반환 (한글 더미 데이터)"""
    logger.info("GET /weather 호출됨")
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
    logger.info("GET /stocks 호출됨")
    return [
        StockItem(symbol="005930", name="삼성전자", price=78500.0, change=1200.0, change_percent=1.55),
        StockItem(symbol="035720", name="카카오", price=48200.0, change=-300.0, change_percent=-0.62),
        StockItem(symbol="AAPL", name="애플", price=263500.0, change=3500.0, change_percent=1.35)
    ]

@router.get("/exchange", response_model=List[ExchangeItem])
def get_exchange():
    """실시간 주요 환율 정보 반환 (한글 더미 데이터)"""
    logger.info("GET /exchange 호출됨")
    return [
        ExchangeItem(currency="USD", rate=1385.5, change=4.5, change_percent=0.33),
        ExchangeItem(currency="JPY", rate=862.4, change=-2.1, change_percent=-0.24),
        ExchangeItem(currency="EUR", rate=1492.8, change=1.2, change_percent=0.08)
    ]

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
