"""Application configuration settings."""
import os
import secrets
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # Application
    APP_NAME: str = "Project Management API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Database (using SQLite for development, PostgreSQL for production)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./project_management.db")
    
    # JWT Settings - SECRET_KEY must be set via environment variable in production
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate SECRET_KEY
        if not self.SECRET_KEY:
            if self.DEBUG:
                # Generate a temporary key for development
                self.SECRET_KEY = secrets.token_urlsafe(32)
                print("WARNING: Using auto-generated SECRET_KEY for development. Set SECRET_KEY environment variable for production.")
            else:
                raise ValueError(
                    "SECRET_KEY environment variable must be set in production. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
                )
        
        # Parse CORS origins from environment if provided
        cors_env = os.getenv("CORS_ORIGINS")
        if cors_env:
            try:
                import json
                self.CORS_ORIGINS = json.loads(cors_env)
            except json.JSONDecodeError:
                self.CORS_ORIGINS = [origin.strip() for origin in cors_env.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
