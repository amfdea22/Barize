#!/bin/bash
# ─────────────────────────────────────────────────────────────
# BARIZE - Script de Setup Inicial
# ─────────────────────────────────────────────────────────────
# Este script prepara o ambiente para primeiro uso:
# 1. Cria .env a partir de .env.example
# 2. Sobe os containers Docker
# 3. Executa migrações Alembic
# 4. Cria usuário admin padrão
# ─────────────────────────────────────────────────────────────

set -euo pipefail

echo "═══════════════════════════════════════════════"
echo "  BARIZE - Setup Inicial"
echo "═══════════════════════════════════════════════"
echo ""

# ─── 1. Verifica Docker ────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não encontrado. Instale Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERRO: docker-compose não encontrado."
    exit 1
fi

# ─── 2. Cria .env se não existir ───────────────────────────
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Arquivo .env criado a partir de .env.example"
        echo "⚠️  Edite o .env com suas configurações (JWT_SECRET, etc.)"
    else
        echo "AVISO: .env.example não encontrado"
    fi
fi

# ─── 3. Sobe os containers ─────────────────────────────────
echo "Construindo e iniciando containers..."
docker-compose -f infra/docker-compose.yml build
docker-compose -f infra/docker-compose.yml up -d db

echo "Aguardando PostgreSQL ficar pronto..."
sleep 10

docker-compose -f infra/docker-compose.yml up -d

echo ""
echo "Containers iniciados:"
docker-compose -f infra/docker-compose.yml ps

# ─── 4. Executa migrações ──────────────────────────────────
echo ""
echo "Executando migrações Alembic..."
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head

# ─── 5. Cria admin padrão ───────────────────────────────────
echo ""
echo "Criando usuário admin padrão..."
docker-compose -f infra/docker-compose.yml exec backend python -c "
from app.database import SessionLocal
from app.models.usuario import Usuario

db = SessionLocal()
try:
    admin = db.query(Usuario).filter(Usuario.username == 'admin').first()
    if not admin:
        admin = Usuario(
            nome='Administrador',
            email='admin@barize.com.br',
            username='admin',
            role='admin',
        )
        admin.set_senha('admin123')
        db.add(admin)
        db.commit()
        print('Admin criado: username=admin, senha=admin123')
    else:
        print('Admin já existe')
finally:
    db.close()
"

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ BARIZE pronto!"
echo ""
echo "  Acesse: http://localhost"
echo "  Login:  admin / admin123"
echo ""
echo "  API:    http://localhost/api/v1"
echo "  Docs:   http://localhost/docs (apenas LAN)"
echo "═══════════════════════════════════════════════"
