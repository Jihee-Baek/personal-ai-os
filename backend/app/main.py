import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import router as api_router

# 백엔드 표준 로깅 기본 설정 (stdout 출력으로 Render 로그 연동)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("app.main")
logger.info("Personal AI OS 백엔드 로깅 시스템이 기동되었습니다.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Personal AI OS의 기반을 담당하는 FastAPI 핵심 백엔드 API 서비스",
    version="0.1.0",
)

# 프론트엔드(Next.js)와 백엔드 간 CORS 연동 설정
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요구사항 상의 엔드포인트 명세(GET /health, GET /weather 등)를 충족하도록
# 프리픽스 없이 루트 라우터에 API 라우터를 바인딩합니다.
app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "message": "Personal AI OS 백엔드 API 루트입니다.",
        "swagger_docs": "/docs"
    }
