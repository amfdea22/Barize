"""
BARIZE - Conexão com Banco de Dados
Pilar 3: Banco de Dados - PostgreSQL + SQLAlchemy + Session Management

Suporta override via variável de ambiente DATABASE_URL (para testes com SQLite).
"""

import os
import sqlite3
from datetime import datetime, date
from sqlalchemy import create_engine, event, text

# ─── Registra adapters SQLite3 para Python 3.12+ (deprecation warning fix) ──
# O adaptador padrão de datetime foi removido no Python 3.12; registramos
# um adaptador que serializa datetime no formato aceito pelo SQLite.
# NOTA: Usamos strftime SEM microssegundos porque func.now() no SQLite
# armazena apenas até segundos. Se incluíssemos .%f, a comparação de strings
# quebraria (ex: "00:33:09" < "00:33:09.000000" → True, que é incorreto).
sqlite3.register_adapter(datetime, lambda v: v.strftime("%Y-%m-%d %H:%M:%S"))
sqlite3.register_adapter(date, lambda v: v.strftime("%Y-%m-%d"))
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator, Optional
from functools import lru_cache
from loguru import logger

from .config import get_settings

settings = get_settings()

# ─── Database URL (com override para testes) ────────────────
def get_database_url() -> str:
    """
    Retorna a URL do banco de dados.
    Permite override via variável de ambiente DATABASE_URL.
    Usado para testes com SQLite in-memory.
    """
    return os.getenv("DATABASE_URL") or settings.DATABASE_URL or settings.DATABASE_URL_PROP


# ─── Engine (lazy, criado sob demanda) ──────────────────────
@lru_cache(maxsize=1)
def get_engine():
    """Cria/cacheia o engine do SQLAlchemy."""
    db_url = get_database_url()
    is_sqlite = db_url.startswith("sqlite")

    if is_sqlite:
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False},
        )

        @event.listens_for(engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, connection_record):
            """Ativa FK constraints no SQLite."""
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()
    else:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False,
        )

        @event.listens_for(engine, "connect")
        def _set_pragma(dbapi_connection, connection_record):
            """Garante FK constraints no PostgreSQL."""
            cursor = dbapi_connection.cursor()
            cursor.execute("SET CONSTRAINTS ALL IMMEDIATE;")
            cursor.close()

    return engine


# ─── Base declarativa para modelos ──────────────────────────
Base = declarative_base()


# ─── Session Factory (lazy) ─────────────────────────────────
def get_session_local():
    """Retorna sessionmaker vinculado ao engine atual."""
    return sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=get_engine(),
    )


SessionLocal = get_session_local()


def get_db() -> Generator[Session, None, None]:
    """
    Dependência FastAPI para injeção de sessão do banco.
    Garante que a sessão é fechada após a requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Cria todas as tabelas (usado apenas em dev/bootstrap).
    Em produção, usar Alembic para migrações.
    """
    # Importa modelos para registrá-los na Base
    from .models import Insumo, Produto, Receita, Movimentacao  # noqa: F401
    from .models import Usuario, AuditLog, FilaImpressao  # noqa: F401
    from .models import Caixa, FechamentoCaixa  # noqa: F401
    from .models import AlertaConfig, AlertaDisparado  # noqa: F401
    from .models import Copo, Material, CopoQuebrado  # noqa: F401
    from .models import Lote  # noqa: F401
    from .models import Recebimento, ItemRecebimento  # noqa: F401
    from .models import Contagem, ItemContagem  # noqa: F401
    from .models import Producao, ItemProducao  # noqa: F401
    from .models import Pagamento  # noqa: F401
    from .models import Cliente, Pedido, PrinterConfig  # noqa: F401
    from .models import Fornecedor, CustoFixo  # noqa: F401
    from .models import POP, ExecucaoPOP  # noqa: F401

    Base.metadata.create_all(bind=get_engine())

    # Migrações manuais para colunas adicionadas depois da criação inicial
    engine = get_engine()
    try:
        with engine.connect() as conn:
            # Verifica se coluna 'tempo_preparo_estimado' existe em pedidos
            cols = [row[1] for row in conn.execute(text("PRAGMA table_info('pedidos')")).fetchall()]
            if 'tempo_preparo_estimado' not in cols:
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN iniciado_em TIMESTAMP"))
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN pronto_em TIMESTAMP"))
                conn.execute(text("ALTER TABLE pedidos ADD COLUMN tempo_preparo_estimado INTEGER"))
                conn.commit()
                logger.info("[BARIZE] Colunas de tempo adicionadas à tabela pedidos")

            # Colunas do checklist (momento, exigencia_fluxo, ordem) em pops
            pop_cols = [row[1] for row in conn.execute(text("PRAGMA table_info('pops')")).fetchall()]
            if 'momento' not in pop_cols:
                conn.execute(text("ALTER TABLE pops ADD COLUMN momento VARCHAR(20)"))
                conn.execute(text("ALTER TABLE pops ADD COLUMN exigencia_fluxo JSON"))
                conn.execute(text("ALTER TABLE pops ADD COLUMN ordem INTEGER"))
                conn.commit()
                logger.info("[BARIZE] Colunas de checklist adicionadas à tabela pops")
    except Exception:
        pass  # Tabela pode não existir ainda

    logger.info("[BARIZE] Tabelas criadas/verificadas com sucesso")
