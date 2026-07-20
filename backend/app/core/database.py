import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
connect_args = {}

if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning("기본 DB 접속 실패 (%s). 로컬 SQLite 백업 DB(sqlite:///./personal_ai_os.db)로 전환합니다.", str(e))
    db_url = "sqlite:///./personal_ai_os.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
