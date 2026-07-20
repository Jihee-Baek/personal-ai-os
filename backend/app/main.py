import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import router as api_router

# 백엔드 표준 로깅 기본 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("app.main")
logger.info("Personal AI OS 백엔드 로깅 시스템 기동")

from sqlalchemy import text

def _auto_migrate_db():
    """운영계 및 기존 DB의 user_stocks 테이블에 신규 칼럼(quantity, avg_buy_price, updated_at)이 없을 경우 동적 추가"""
    try:
        Base.metadata.create_all(bind=engine)
        with engine.begin() as conn:
            is_sqlite = "sqlite" in str(engine.url)
            if is_sqlite:
                try:
                    conn.execute(text("ALTER TABLE user_stocks ADD COLUMN quantity FLOAT DEFAULT 1.0;"))
                except Exception:
                    pass
                try:
                    conn.execute(text("ALTER TABLE user_stocks ADD COLUMN avg_buy_price FLOAT DEFAULT 0.0;"))
                except Exception:
                    pass
                try:
                    conn.execute(text("ALTER TABLE user_stocks ADD COLUMN updated_at DATETIME;"))
                except Exception:
                    pass
            else:
                conn.execute(text("ALTER TABLE user_stocks ADD COLUMN IF NOT EXISTS quantity DOUBLE PRECISION DEFAULT 1.0 NOT NULL;"))
                conn.execute(text("ALTER TABLE user_stocks ADD COLUMN IF NOT EXISTS avg_buy_price DOUBLE PRECISION DEFAULT 0.0 NOT NULL;"))
                conn.execute(text("ALTER TABLE user_stocks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;"))
        logger.info("Database user_stocks 테이블 신규 칼럼(quantity, avg_buy_price) 자동 마이그레이션 성공")
    except Exception as db_err:
        logger.error("Database 스키마 동적 마이그레이션 중 에러 발생: %s", str(db_err))

_auto_migrate_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personal AI OS FastAPI 백엔드 API 서비스",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "message": "Personal AI OS 백엔드 API 루트입니다.",
        "swagger_docs": "/docs"
    }
