from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./cosixis.db"
    upload_dir: str = "uploads"
    default_user_id: int = 1
    app_name: str = "Chief of Staff Platform"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
