from abc import ABC, abstractmethod
from typing import Dict

class AIProvider(ABC):
    """
    다양한 LLM 프로바이더 연동을 위한 추상 베이스 클래스 (인터페이스)
    """
    @abstractmethod
    def generate_response(self, prompt: str) -> str:
        pass

class ClaudeProvider(AIProvider):
    """Anthropic Claude 모델 프로바이더"""
    def generate_response(self, prompt: str) -> str:
        return f"[Claude 데모 응답] 입력된 질문: '{prompt}'"

class GPTProvider(AIProvider):
    """OpenAI GPT 모델 프로바이더"""
    def generate_response(self, prompt: str) -> str:
        return f"[GPT 데모 응답] 입력된 질문: '{prompt}'"

class GeminiProvider(AIProvider):
    """Google Gemini 모델 프로바이더"""
    def generate_response(self, prompt: str) -> str:
        return f"[Gemini 데모 응답] 입력된 질문: '{prompt}'"

class DeepSeekProvider(AIProvider):
    """DeepSeek 모델 프로바이더"""
    def generate_response(self, prompt: str) -> str:
        return f"[DeepSeek 데모 응답] 입력된 질문: '{prompt}'"

class AIService:
    """
    AI 서비스 매니저 클래스 (Provider Pattern 적용)
    원하는 모델 프로바이더로 손쉽게 스위칭하여 호출 가능합니다.
    """
    def __init__(self, default_provider: str = "claude"):
        self.providers: Dict[str, AIProvider] = {
            "claude": ClaudeProvider(),
            "gpt": GPTProvider(),
            "gemini": GeminiProvider(),
            "deepseek": DeepSeekProvider(),
        }
        self.default_provider = default_provider

    def chat(self, message: str, provider_name: str = None) -> str:
        target = provider_name or self.default_provider
        provider = self.providers.get(target.lower())
        if not provider:
            raise ValueError(f"지원하지 않는 AI 프로바이더명입니다: {target}")
        return provider.generate_response(message)
