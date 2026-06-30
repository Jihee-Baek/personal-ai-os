from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# SQLAlchemy 데이터베이스 접속 엔진 생성
# pool_pre_ping은 주기적으로 데이터베이스와의 연결 상태를 체크합니다.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

# 데이터베이스 트랜잭션 세션 생성 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 선언적 모델 Base 클래스
Base = declarative_base()

# FastAPI 의존성용 DB 세션 라이프사이클 관리 제너레이터
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
