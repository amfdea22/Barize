# ─────────────────────────────────────────────────────────────
# barize - Dockerfile da API Backend
# Pilar 2: Conteinerização
# Pilar 5: Segurança - Ambiente isolado e controlado
# ─────────────────────────────────────────────────────────────

FROM python:3.12-slim AS builder

WORKDIR /app

# Instala dependências de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── Imagem final (menor) ───────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Instala apenas runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia dependências instaladas
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Cria diretórios necessários
RUN mkdir -p /var/log/barize /backups

# Copia código fonte
COPY app/ /app/app/
COPY alembic.ini /app/
COPY alembic/ /app/alembic/

# Usuário não-root para segurança
RUN useradd -m -u 1000 barize && chown -R barize:barize /app /var/log/barize /backups
USER barize

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
