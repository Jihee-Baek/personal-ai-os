import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.models.memo import Memo
from app.models.stock import UserStock

from app.services.ai_service import AIService
from app.services.weather_service import WeatherService
from app.services.finance_service import FinanceService
from app.services.github_service import GitHubService

logger = logging.getLogger(__name__)

class BriefingService:
    """
    날씨, 주식, 일정, 메모, GitHub 활동 정보를 통합하여
    LLM AI가 분석/작성한 종합 일일 브리핑 리포트를 제공하는 서비스 (장애 극복 설계 탑재)
    """
    def __init__(self, ai_service: AIService, weather_service: WeatherService, 
                 finance_service: FinanceService, github_service: GitHubService):
        self.ai = ai_service
        self.weather = weather_service
        self.finance = finance_service
        self.github = github_service

    def generate_daily_briefing(self, db: Session) -> str:
        logger.info("BriefingService: 종합 AI 일일 브리핑을 위한 데이터 취합 시작")
        
        # 1단계: 날씨 수집 (독립 예외 처리)
        try:
            weather_data = self.weather.get_current_weather()
            weather_desc = f"지역: {weather_data.location}, 기온: {weather_data.temperature}°C, 상태: {weather_data.condition}, 습도: {weather_data.humidity}%, 풍속: {weather_data.wind_speed}m/s"
        except Exception as e:
            logger.error("BriefingService: 날씨 정보 취합 중 에러 발생: %s", str(e))
            weather_desc = "날씨 정보를 불러오는 데 실패했습니다."

        # 2단계: 환율 정보 수집 (독립 예외 처리)
        try:
            exchange_list = self.finance.get_realtime_exchange()
            exchange_desc = ", ".join([f"{ex.currency}: {ex.rate}원" for ex in exchange_list])
        except Exception as e:
            logger.error("BriefingService: 환율 정보 취합 중 에러 발생: %s", str(e))
            exchange_desc = "환율 정보를 불러오는 데 실패했습니다."

        # 3단계: 관심 주식 수집 및 DB 연동 (DB 장애 격리 처리)
        try:
            db_stocks = db.query(UserStock).all()
            stock_payload = [{"symbol": s.symbol, "name": s.name} for s in db_stocks]
            stock_list = self.finance.get_realtime_stocks(stock_payload)
            if stock_list:
                stock_desc = ", ".join([f"{st.name}({st.symbol}): {st.price}원 ({st.change_percent}%)" for st in stock_list])
            else:
                stock_desc = "등록된 관심 주식 종목이 없습니다."
        except Exception as e:
            logger.error("BriefingService: 주식 및 DB 조회 중 에러 발생 (폴백 적용): %s", str(e))
            stock_desc = "데이터베이스 연결 오류로 인해 주식 시황을 가져오지 못했습니다."

        # 4단계: 일정(Todo) 수집 (DB 장애 격리 처리)
        try:
            todos = db.query(Todo).filter(Todo.completed == False).order_by(Todo.created_at.asc()).all()
            if todos:
                todo_desc = "\n".join([f"- {t.title} (기한: {t.due_date or '없음'}, 반복: {t.recurrence})" for t in todos])
            else:
                todo_desc = "남아 있는 오늘 일정이 없습니다. 가뿐한 하루네요!"
        except Exception as e:
            logger.error("BriefingService: 할일 목록 DB 조회 중 에러 발생 (폴백 적용): %s", str(e))
            todo_desc = "데이터베이스 연결 오류로 인해 오늘의 일정을 가져오지 못했습니다."
            todos = []

        # 5단계: 최근 메모(Memo) 수집 (DB 장애 격리 처리)
        try:
            memos = db.query(Memo).order_by(Memo.created_at.desc()).limit(3).all()
            if memos:
                memo_desc = "\n".join([f"- {m.content[:50]}" for m in memos])
            else:
                memo_desc = "기록된 최근 메모가 없습니다."
        except Exception as e:
            logger.error("BriefingService: 메모 DB 조회 중 에러 발생 (폴백 적용): %s", str(e))
            memo_desc = "데이터베이스 연결 오류로 인해 최근 메모 정보를 가져오지 못했습니다."

        # 6단계: GitHub 활동 수집 (독립 예외 처리)
        try:
            github_events = self.github.get_recent_events()
            if github_events:
                github_desc = "\n".join([f"- [{ev.type}] {ev.repo}: {ev.message}" for ev in github_events[:3]])
            else:
                github_desc = "최근 깃허브 개발 활동 이력이 없습니다."
        except Exception as e:
            logger.error("BriefingService: GitHub 활동 정보 취합 중 에러 발생: %s", str(e))
            github_desc = "GitHub 통신 오류로 인해 최근 이력을 가져오지 못했습니다."

        # AI 프롬프트 조합
        prompt = f"""
당신은 사용자의 든든한 개인 AI 비서입니다. 아래 제공된 사용자의 실시간 생활 지표 데이터를 바탕으로 친절하고 정중한 존댓말 투의 '오늘의 아침 요약 브리핑'을 3~4문장으로 격려 가득하게 요약해 작성해 주세요.
이모지를 풍부하게 곁들여서 한눈에 가독성 좋게 들어오게 글을 꾸며주세요.

[실시간 날씨 정보]
{weather_desc}

[실시간 주요 환율]
{exchange_desc}

[관심 주식 시황]
{stock_desc}

[오늘의 해야할 일]
{todo_desc}

[최근 작성한 메모 노트]
{memo_desc}

[최근 개발 활동 (GitHub)]
{github_desc}

주의사항: 사용자가 기분 좋게 하루를 시작할 수 있도록 밝고 희망찬 멘트로 마무리해 주세요. 출력은 한국어로만 해주세요.
"""

        logger.info("BriefingService: AI 분석 요약 질의 요청 송신")
        
        try:
            # OpenRouter AI에 비서 프롬프트 질의
            reply = self.ai.chat(prompt)
            logger.info("BriefingService: AI 종합 브리핑 작성 수신 성공")
            return reply
        except Exception as e:
            logger.error("BriefingService: AI 브리핑 LLM 통신 실패로 백업용 텍스트 생성: %s", str(e))
            
            # AI 통신 장애 시 화면이 깨지지 않고 친절하게 노출되도록 백업용 요약 제공
            temp_temp = weather_data.temperature if 'weather_data' in locals() and hasattr(weather_data, 'temperature') else 20.0
            temp_cond = weather_data.condition if 'weather_data' in locals() and hasattr(weather_data, 'condition') else "맑음"
            return f"""
☀️ 안녕하세요! 오늘 날씨는 {temp_temp}°C로 {temp_cond} 상태입니다.
📋 오늘 진행하실 일정들과 함께 활기차게 시작해 보세요.
💻 항상 곁에서 응원하겠습니다. 오늘도 멋지고 알찬 하루 보내시기 바랍니다! (AI 통신 지연으로 인해 기본 요약 리포트를 송출합니다.)
"""
