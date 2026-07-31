"""
BARIZE - Main Application (FastAPI)
Pilar 2: Arquitetura de Software - Conteinerização, Logs, Modo Quiosque
Pilar 5: Segurança - Criptografia e Controle de Acesso

FastAPI application entrypoint with:
- Loguru logging with rotation
- CORS configured for Kiosk mode
- All routers registered
"""

# Força SelectorEventLoop no Windows (Python ≥3.12) para evitar
# bug do ProactorEventLoop que impede bind do socket ASGI.
import sys as _sys
if _sys.platform == "win32" and _sys.version_info >= (3, 12):
    import asyncio as _asyncio
    _asyncio.set_event_loop_policy(_asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .dependencies import limiter
from loguru import logger
import sys
import os
from contextlib import asynccontextmanager

from .config import get_settings
from .database import get_engine, Base, init_db

settings = get_settings()


# ─── Configuração de Logging (Loguru) ───────────────────────
def setup_logging():
    """Configura Loguru com rotação de arquivos."""
    log_dir = settings.LOG_DIR
    os.makedirs(log_dir, exist_ok=True)

    # Remove handler padrão
    logger.remove()

    # Console (stdout) - sem cores no Windows para evitar erro de encoding
    import platform
    is_windows = platform.system() == "Windows"
    
    logger.add(
        sys.stdout,
        format=(
            "{time:YYYY-MM-DD HH:mm:ss} | "
            "{level: <8} | "
            "{name}:{function}:{line} - {message}"
        ),
        level=settings.LOG_LEVEL,
        colorize=not is_windows,
    )

    # Arquivo com rotação
    logger.add(
        os.path.join(log_dir, "barize.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        compression="zip",
        level=settings.LOG_LEVEL,
    )

    # Arquivo separado para erros
    logger.add(
        os.path.join(log_dir, "barize_error.log"),
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        rotation=settings.LOG_ROTATION,
        retention=settings.LOG_RETENTION,
        level="ERROR",
    )

    logger.info(f"[BARIZE] Logging configurado: {log_dir}")


# ─── Lifecycle ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    setup_logging()
    logger.info(f"=== {settings.APP_NAME} v{settings.APP_VERSION} ===")
    db_url = settings.DATABASE_URL or f"{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    logger.info(f"Database: {db_url}")

    # Cria tabelas (dev apenas - usar Alembic em produção)
    if settings.DEBUG:
        try:
            import asyncio
            await asyncio.to_thread(init_db)  # run sync DB init in threadpool
            logger.info("[BARIZE] Tabelas criadas (modo debug)")
        except Exception as e:
            logger.exception(f"[BARIZE] Falha ao inicializar DB: {e}")
            raise

    yield  # App rodando

    logger.info("[BARIZE] Serviço encerrando...")


# ─── FastAPI App ────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ERP profissional para gestão de bares e restaurantes",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# ─── Security Headers ─────────────────────────────────────
from .middleware.security import setup_security_middleware
setup_security_middleware(app)

# ─── Metrics ──────────────────────────────────────────────
from .middleware.metrics import setup_metrics_middleware
setup_metrics_middleware(app)

# ─── Rate Limiting ────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS (Modo Quiosque) ───────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Middleware de Auditoria de IP ───────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Loga todas as requisições para auditoria."""
    logger.debug(f"{request.method} {request.url.path} - {request.client.host if request.client else 'unknown'}")
    response = await call_next(request)
    return response


# ─── Global Exception Handler ───────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Captura exceções não tratadas."""
    logger.exception(f"Erro não tratado: {exc} | Path: {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Consulte os logs."},
    )


# ─── Arquivos Estáticos (uploads) ──────────────────────────
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# ─── Registro de Rotas ──────────────────────────────────────
from .routers import auth, pdv, estoque, cmv, caixa, relatorios, admin, pedidos, pagamentos, clientes
from .routers import copos, materiais, copos_quebrados
from .routers import lotes, recebimentos, contagens, producao
from .routers import upload, cardapio, produto_lotes, etiquetas, fichas_tecnicas, precificacao, analise_estoque, fornecedores, financeiro_plus, pops

app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(pdv.router, prefix=settings.API_PREFIX)
app.include_router(estoque.router, prefix=settings.API_PREFIX)
app.include_router(cmv.router, prefix=settings.API_PREFIX)
app.include_router(caixa.router, prefix=settings.API_PREFIX)
app.include_router(relatorios.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(pedidos.router, prefix=settings.API_PREFIX)
app.include_router(pagamentos.router, prefix=settings.API_PREFIX)
app.include_router(clientes.router, prefix=settings.API_PREFIX)
app.include_router(copos.router, prefix=settings.API_PREFIX)
app.include_router(materiais.router, prefix=settings.API_PREFIX)
app.include_router(copos_quebrados.router, prefix=settings.API_PREFIX)
app.include_router(lotes.router, prefix=settings.API_PREFIX)
app.include_router(produto_lotes.router, prefix=settings.API_PREFIX)
app.include_router(etiquetas.router, prefix=settings.API_PREFIX)
app.include_router(fichas_tecnicas.router, prefix=settings.API_PREFIX)
app.include_router(recebimentos.router, prefix=settings.API_PREFIX)
app.include_router(contagens.router, prefix=settings.API_PREFIX)
app.include_router(producao.router, prefix=settings.API_PREFIX)
app.include_router(upload.router, prefix=settings.API_PREFIX)
app.include_router(cardapio.router, prefix=settings.API_PREFIX)
app.include_router(precificacao.router, prefix=settings.API_PREFIX)
app.include_router(analise_estoque.router, prefix=settings.API_PREFIX)
app.include_router(fornecedores.router, prefix=settings.API_PREFIX)
app.include_router(financeiro_plus.router, prefix=settings.API_PREFIX)
app.include_router(pops.router, prefix=settings.API_PREFIX)


# ─── Health Check ───────────────────────────────────────────
@app.get("/")
def root():
    return {
        "servico": "BARIZE",
        "versao": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else None,
    }


# ─── Entrypoint ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # disabled on Windows to prevent subprocess issues
        log_level=settings.LOG_LEVEL.lower(),
    )
