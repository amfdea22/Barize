"""
BARIZE - Configuração Centralizada
Pilar 2: Arquitetura de Software - Gerenciamento de Configuração via env
Pilar 5: Segurança - Criptografia e Secrets Management
"""

from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator
from functools import lru_cache
import os


class Settings(BaseSettings):
    # ─── App ──────────────────────────────────────────────
    APP_NAME: str = "BARIZE - ERP para Bares"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # ─── Database ──────────────────────────────────────────
    DATABASE_URL: Optional[str] = None  # override opcional (ex: sqlite para dev)
    POSTGRES_USER: str = "barize"
    POSTGRES_PASSWORD: str = ""  # ⚠️ DEVE ser definida via .env em produção
    POSTGRES_HOST: str = "db"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "barize"

    @property
    def DATABASE_URL_PROP(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def DATABASE_URL_ASYNC(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # ─── Segurança ────────────────────────────────────────
    JWT_SECRET: str = ""  # ⚠️ DEVE ser definida via .env em produção
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8

    # ─── Criptografia ─────────────────────────────────────
    HASH_ALGORITHM: str = "bcrypt"
    BCRYPT_ROUNDS: int = 12

    # ─── Rate Limiting ────────────────────────────────────
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_DEFAULT: str = "30/minute"
    RATE_LIMIT_LOGIN: str = "5/minute"

    # ─── CORS ─────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"

    @property
    def CORS_ORIGINS(self) -> list:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # ─── Impressão (Worker) ───────────────────────────────
    PRINT_POLL_INTERVAL_SECONDS: int = 2
    PRINTER_BAUD: int = 9600
    PRINTER_TIMEOUT: float = 5.0

    # ─── Backup ───────────────────────────────────────────
    BACKUP_DIR: str = "/backups"
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_CRON: str = "0 03:00 * * *"

    # ─── Alertas ──────────────────────────────────────────
    ALERTA_POLL_INTERVAL_SECONDS: int = 60
    DISCORD_WEBHOOK_URL: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    SLACK_WEBHOOK_URL: str = ""

    # ─── Logging ──────────────────────────────────────────
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "/var/log/barize"
    LOG_ROTATION: str = "10 MB"
    LOG_RETENTION: str = "30 days"

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_prod_settings(self) -> "Settings":
        """Valida secrets apenas quando usando PostgreSQL (não SQLite de testes)."""
        db_url = self.DATABASE_URL or self.DATABASE_URL_PROP
        if db_url.startswith("sqlite"):
            return self  # skip validation in test/dev with SQLite

        if not self.POSTGRES_PASSWORD:
            raise ValueError(
                "POSTGRES_PASSWORD não definida. "
                "Crie um arquivo .env com POSTGRES_PASSWORD=sua_senha"
            )
        if not self.JWT_SECRET:
            raise ValueError(
                "JWT_SECRET não definida. "
                "Crie um arquivo .env com JWT_SECRET=sua_chave_secreta"
            )
        if len(self.JWT_SECRET) < 16:
            raise ValueError("JWT_SECRET deve ter no mínimo 16 caracteres")

        return self


@lru_cache()
def get_settings() -> Settings:
    return Settings()
