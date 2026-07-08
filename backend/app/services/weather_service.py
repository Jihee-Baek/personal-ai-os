import httpx
import logging
from app.core.config import settings
from app.schemas.api_schemas import WeatherResponse

logger = logging.getLogger(__name__)

class WeatherService:
    """
    OpenWeatherMap API를 사용하여 실시간 날씨 데이터를 가져오는 서비스
    """
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.location = "Seoul" # 기본 리전: 서울

    def get_current_weather(self) -> WeatherResponse:
        # API Key가 없거나 기본 더미 값일 경우 Fallback 데모 응답을 제공합니다.
        if not self.api_key or self.api_key == "mock_weather_key":
            logger.warning("WeatherService: 날씨 API 키가 감지되지 않아 데모 모드로 동작합니다.")
            return WeatherResponse(
                location="서울 (데모)",
                temperature=24.5,
                condition="맑음 (데모)",
                humidity=60,
                wind_speed=2.5
            )

        url = f"https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": self.location,
            "appid": self.api_key,
            "units": "metric", # 섭씨 단위 변환
            "lang": "kr" # 한글 상태 문구 반환
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                logger.info("WeatherService: OpenWeatherMap 실시간 날씨 데이터 수집 시도")
                response = client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # 수신 데이터 파싱 및 매핑
                    main_data = data.get("main", {})
                    weather_desc = data.get("weather", [{}])[0].get("description", "맑음")
                    wind_data = data.get("wind", {})
                    
                    logger.info("WeatherService: 실시간 날씨 데이터 수집 성공 (온도: %s°C)", main_data.get("temp"))
                    return WeatherResponse(
                        location="서울",
                        temperature=float(main_data.get("temp", 0.0)),
                        condition=weather_desc,
                        humidity=int(main_data.get("humidity", 0)),
                        wind_speed=float(wind_data.get("speed", 0.0))
                    )
                else:
                    logger.error("WeatherService: API 호출 오류 발생 - 상태코드: %d, 에러: %s", 
                                 response.status_code, response.text)
                    
        except httpx.RequestError as exc:
            logger.error("WeatherService: HTTP 통신 네트워크 오류 발생: %s", str(exc))
        except Exception as e:
            logger.error("WeatherService: 데이터 파싱 중 알 수 없는 예외 발생: %s", str(e))
            
        # 통신 에러 발생 시 최후 수단으로 백업 더미 데이터를 제공하여 화면 깨짐을 방지합니다.
        logger.warning("WeatherService: API 통신 에러로 인해 백업 더미 날씨 정보를 리턴합니다.")
        return WeatherResponse(
            location="서울 (통신백업)",
            temperature=20.0,
            condition="구름조금",
            humidity=50,
            wind_speed=1.8
        )
