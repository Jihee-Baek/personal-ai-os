import httpx
from abc import ABC, abstractmethod
from typing import Dict
from app.core.config import settings

class AIProvider(ABC):
    """
    LLM 프로바이더 연동을 위한 추상 베이스 클래스 (인터페이스)
    """
    @abstractmethod
    def generate_response(self, prompt: str, api_key: str) -> str:
        pass

class BaseOpenRouterProvider(AIProvider):
    """
    OpenRouter 공통 API 연동 구현체 (상속용)
    """
    model_name: str = ""

    def generate_response(self, prompt: str, api_key: str) -> str:
        # API Key가 등록되지 않았거나 기본 더미 값일 경우 Fallback 데모 응답을 돌려줍니다.
        if not api_key or api_key == "mock_key":
            return f"[{self.__class__.__name__} 데모 모드] API 키가 감지되지 않았습니다. 입력 질문: '{prompt}'"

        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/Jihee-Baek/personal-ai-os",
            "X-Title": "Personal AI OS"
        }
        data = {
            "model": self.model_name,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }

        try:
            # 동기식 HTTP 요청 수행 (타임아웃 30초)
            with httpx.Client(timeout=30.0) as client:
                response = client.post(url, headers=headers, json=data)
                
                # API 호출 결과 상태 코드 검사
                if response.status_code != 200:
                    return f"[AI 통신 에러 (코드 {response.status_code})]: {response.text}"
                
                result = response.json()
                choices = result.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    return content if content else "답변 내용이 비어 있습니다."
                
                return f"[AI 파싱 에러]: 정상적인 답변 데이터를 추출하지 못했습니다. 응답 데이터: {result}"
                
        except httpx.RequestError as exc:
            return f"[AI 네트워크 에러]: OpenRouter 서버와 통신을 맺는 중 에러가 발생했습니다: {exc}"
        except Exception as e:
            return f"[AI 알 수 없는 예외 발생]: {str(e)}"

class ClaudeProvider(BaseOpenRouterProvider):
    """Anthropic Claude 대용 Llama 3 8B 무료 모델"""
    model_name = "meta-llama/llama-3-8b-instruct:free"

class GPTProvider(BaseOpenRouterProvider):
    """OpenAI GPT 대용 Gemma 2 9B 무료 모델"""
    model_name = "google/gemma-2-9b-it:free"

class GeminiProvider(BaseOpenRouterProvider):
    """Google Gemini 2.0 Flash 무료 모델"""
    model_name = "google/gemini-2.0-flash-exp:free"

class DeepSeekProvider(BaseOpenRouterProvider):
    """DeepSeek 무료 대용 Llama 3 8B 무료 모델"""
    model_name = "meta-llama/llama-3-8b-instruct:free"

class AIService:
    """
    AI 서비스 매니저 클래스 (Provider Pattern)
    환경변수 API Key 바인딩 및 선택된 프로바이더에 질의 처리를 수행합니다.
    """
    def __init__(self, default_provider: str = "gemini"):
        self.providers: Dict[str, AIProvider] = {
            "claude": ClaudeProvider(),
            "gpt": GPTProvider(),
            "gemini": GeminiProvider(),
            "deepseek": DeepSeekProvider(),
        }
        self.default_provider = default_provider
        self.api_key = settings.OPENROUTER_API_KEY

    def chat(self, message: str, provider_name: str = None) -> str:
        target = provider_name or self.default_provider
        provider = self.providers.get(target.lower())
        if not provider:
            raise ValueError(f"지원하지 않는 AI 프로바이더입니다: {target}")
        return provider.generate_response(message, self.api_key)
