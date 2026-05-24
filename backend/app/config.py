from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    database_url: str = "sqlite:///./zibro.db"
    upload_dir: str = "./static/uploads"
    frontend_url: str = "http://localhost:5173"
    sector_radius_m: float = 500.0

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
