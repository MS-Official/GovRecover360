from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_provider: str = "mock"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    minimax_api_key: str = ""
    openai_model: str = "gpt-3.5-turbo"
    gemini_model: str = "gemini-pro"
    minimax_model: str = "minimax-text-01"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
