from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    """
    애플리케이션 전역 설정 클래스
    환경변수 및 .env 파일로부터 로딩을 지원합니다.
    """
    PROJECT_NAME: str = "Personal AI OS"
    
    # 데이터베이스 연결 문자열
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@postgres:5432/personal_ai_os"
    )
    
    # OpenRouter API 인증키
    OPENROUTER_API_KEY: str = Field(default="mock_key")
    
    # 깃허브 및 날씨 등 외부 서비스 토큰
    GITHUB_TOKEN: str = Field(default="mock_token")
    WEATHER_API_KEY: str = Field(default="mock_weather_key")

    # Pydantic v2 설정 구성
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
