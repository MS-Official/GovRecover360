from app.config import settings
from providers.base import AIProvider
from providers.mock import MockProvider
from providers.openai_provider import OpenAIProvider
from providers.gemini_provider import GeminiProvider
from providers.minimax_provider import MinimaxProvider


def get_ai_provider() -> AIProvider:
    provider_map = {
        "mock": MockProvider,
        "openai": OpenAIProvider,
        "gemini": GeminiProvider,
        "minimax": MinimaxProvider,
    }
    provider_name = settings.ai_provider.lower()
    provider_class = provider_map.get(provider_name)
    if provider_class is None:
        raise ValueError(f"Unknown AI provider: {settings.ai_provider}. Supported: {list(provider_map.keys())}")
    return provider_class()
