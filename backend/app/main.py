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

# 테이블 자동 생성 보장
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database 테이블 스키마 동적 마이그레이션 및 생성 완료")
except Exception as db_err:
    logger.error("Database 테이블 생성 중 오류: %s", str(db_err))

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
