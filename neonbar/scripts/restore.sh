#!/bin/bash
# ─────────────────────────────────────────────────────────────
# BARIZE - Script de Restauração de Backup
# ─────────────────────────────────────────────────────────────
# Uso: ./restore.sh <arquivo_backup>
# Ex:  ./restore.sh /backups/barize_20260716_030000.sql.gz
# ─────────────────────────────────────────────────────────────

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Uso: $0 <arquivo_backup>"
    echo "Ex:  $0 /backups/barize_20260716_030000.sql.gz"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERRO: Arquivo não encontrado: ${BACKUP_FILE}"
    exit 1
fi

# ─── Configuração ───────────────────────────────────────────
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-barize}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-barize_secret}"
POSTGRES_DB="${POSTGRES_DB:-barize}"

echo "═══════════════════════════════════════════════"
echo "  BARIZE - Restauração de Backup"
echo "═══════════════════════════════════════════════"
echo "Arquivo: ${BACKUP_FILE}"
echo "Banco:   ${POSTGRES_DB}"
echo "Host:    ${POSTGRES_HOST}:${POSTGRES_PORT}"
echo ""

read -p "Isso SUBSTITUIRÁ todos os dados. Continuar? (s/N) " confirm
if [ "${confirm}" != "s" ]; then
    echo "Restauração cancelada."
    exit 0
fi

# ─── Restaura ───────────────────────────────────────────────
export PGPASSWORD="${POSTGRES_PASSWORD}"

echo "Descomprimindo e restaurando..."
gunzip -c "${BACKUP_FILE}" | pg_restore \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --clean \
    --if-exists \
    --verbose \
    2>&1

unset PGPASSWORD

echo ""
echo "✅ Restauração concluída!"
echo "⚠️  Não esqueça de verificar os dados e reiniciar os serviços."
