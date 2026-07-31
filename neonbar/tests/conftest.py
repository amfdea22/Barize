"""
BARIZE - Configuração de Testes (conftest)
Usa SQLite in-memory para testes isolados e rápidos.
"""

# ─── CRÍTICO: Setar variáveis de ambiente antes de qualquer import ──
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_barize.db"
os.environ["JWT_SECRET"] = "test-jwt-secret-key-for-tests"
os.environ["LOG_LEVEL"] = "CRITICAL"
os.environ["ALLOWED_ORIGINS"] = "http://test:8000"
os.environ["DEBUG"] = "true"

import sys
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

# Adiciona backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# ─── Importa modelos ANTES de criar Base.metadata ──────────
# Isso garante que todos os modelos estejam registrados na Base
from app.database import Base
from app.models import (  # noqa: F401 - registra modelos na Base
    Insumo, Produto, Receita, Movimentacao,
    Usuario, AuditLog, FilaImpressao,
    Caixa, FechamentoCaixa,
    AlertaConfig, AlertaDisparado,
    Pagamento, Cliente,
    Lote, Recebimento, ItemRecebimento,
    Contagem, ItemContagem,
    Producao, ItemProducao,
)

# ─── Database Test (SQLite) ────────────────────────────────
TEST_DATABASE_URL = "sqlite:///./test_barize.db"

# Remove banco anterior para evitar schema desatualizado
_db_path = TEST_DATABASE_URL.replace("sqlite:///", "", 1)
if os.path.exists(_db_path):
    os.remove(_db_path)

engine_test = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

@event.listens_for(engine_test, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

# Cria tabelas
Base.metadata.create_all(bind=engine_test)


# ─── Fixtures ───────────────────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Garante que as tabelas existem durante toda a sessão."""
    Base.metadata.create_all(bind=engine_test)
    yield
    # Limpa após todos os testes
    # Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def db_session(setup_database) -> Generator[Session, None, None]:
    """Sessão isolada para cada teste com rollback automático."""
    connection = engine_test.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """Test client com banco de teste injetado."""
    from app.main import app
    from app.database import get_db

    # Override da dependência do banco
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


def _criar_usuario(db, username, role, senha="Teste1234"):
    """Cria usuário de teste e retorna token."""
    from app.models.usuario import Usuario
    from app.services.auth_service import criar_token
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if not user:
        user = Usuario(
            nome=f"{role.title()} Test",
            email=f"{username}@test.com",
            username=username,
            role=role,
        )
        user.set_senha(senha)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return criar_token(user)


@pytest.fixture
def admin_token(db_session):
    """Token JWT para usuário admin."""
    return _criar_usuario(db_session, "admin_test", "admin")


@pytest.fixture
def gerente_token(db_session):
    """Token JWT para usuário gerente."""
    return _criar_usuario(db_session, "gerente_test", "gerente")


@pytest.fixture
def bartender_token(db_session):
    """Token JWT para usuário bartender."""
    return _criar_usuario(db_session, "bartender_test", "bartender")


@pytest.fixture
def seed_insumos(db_session):
    """Popula insumos básicos para testes."""
    from app.models.insumo import Insumo
    
    insumos = [
        Insumo(nome="Cachaça Teste", categoria="Bebida", unidade_medida="ml",
               estoque_atual=1000, estoque_minimo=100, custo_unitario=0.05),
        Insumo(nome="Limão Teste", categoria="Insumo", unidade_medida="un",
               estoque_atual=50, estoque_minimo=10, custo_unitario=0.80),
        Insumo(nome="Gelo Teste", categoria="Insumo", unidade_medida="un",
               estoque_atual=200, estoque_minimo=50, custo_unitario=0.10),
    ]
    db_session.add_all(insumos)
    db_session.commit()
    return {i.nome: i for i in db_session.query(Insumo).all()}


@pytest.fixture
def seed_produtos(db_session, seed_insumos):
    """Popula produtos e receitas para testes."""
    from app.models.produto import Produto
    from app.models.receita import Receita
    
    insumos = seed_insumos
    
    produto = Produto(nome="Caipirinha Teste", categoria="Drinks", preco_venda=18.00)
    db_session.add(produto)
    db_session.commit()
    
    receitas = [
        Receita(produto_id=produto.id, insumo_id=insumos["Cachaça Teste"].id, quantidade_necessaria=50),
        Receita(produto_id=produto.id, insumo_id=insumos["Limão Teste"].id, quantidade_necessaria=1),
        Receita(produto_id=produto.id, insumo_id=insumos["Gelo Teste"].id, quantidade_necessaria=3),
    ]
    db_session.add_all(receitas)
    db_session.commit()
    
    return {"produto": produto, "insumos": insumos}
