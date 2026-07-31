#!/bin/bash
# ─────────────────────────────────────────────────────────────
# BARIZE - Script de Backup Automatizado
# Pilar 2: Backup Automatizado - pg_dump + rclone
# ─────────────────────────────────────────────────────────────
# Este script deve ser executado como Cron job (Linux/systemd)
# ou como tarefa agendada no Windows.
#
# Regra de ouro: Backup não testado não é backup!
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Configuração ───────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-db}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-barize}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-barize_secret}"
POSTGRES_DB="${POSTGRES_DB:-barize}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/barize_${TIMESTAMP}.sql.gz"
BACKUP_LOG="${BACKUP_DIR}/backup.log"

# ─── Cria diretório se não existir ─────────────────────────
mkdir -p "${BACKUP_DIR}"

# ─── Função de log ──────────────────────────────────────────
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${BACKUP_LOG}"
}

# ─── 1. Executa pg_dump ─────────────────────────────────────
log "Iniciando backup do banco ${POSTGRES_DB}..."

export PGPASSWORD="${POSTGRES_PASSWORD}"

if pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=custom \
    --verbose \
    --no-owner \
    2>> "${BACKUP_LOG}" | gzip > "${BACKUP_FILE}"; then

    FILESIZE=$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || echo 0)
    log "Backup concluído: ${BACKUP_FILE} (${FILESIZE} bytes)"
else
    log "ERRO: Falha no pg_dump!"
    exit 1
fi

unset PGPASSWORD

# ─── 2. Testa integridade do backup ─────────────────────────
log "Testando integridade do backup..."

if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
    log "Backup íntegro: sim"
else
    log "ERRO: Backup corrompido!"
    exit 1
fi

# ─── 3. Remove backups antigos (retenção) ───────────────────
log "Removendo backups com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_DIR}" -name "barize_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "barize_*.sql.gz" -mtime +${RETENTION_DAYS} -print

# ─── 4. Opcional: enviar para nuvem (rclone) ───────────────
# Descomente e configure o rclone para enviar para Google Drive, S3, etc.
#
# if command -v rclone &> /dev/null; then
#     log "Enviando para nuvem (rclone)..."
#     rclone copy "${BACKUP_FILE}" "gdrive:barize-backups/" --verbose
#     log "Upload para nuvem concluído"
# fi

# ─── 5. Envia notificação (opcional) ───────────────────────
# curl -s -X POST "${DISCORD_WEBHOOK_URL}" \
#     -H "Content-Type: application/json" \
#     -d "{\"content\": \"✅ Backup BARIZE concluído: ${BACKUP_FILE} (${FILESIZE} bytes)\"}" \
#     &> /dev/null || true

log "Backup finalizado com sucesso!"
exit 0
