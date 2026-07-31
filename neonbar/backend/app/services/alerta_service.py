"""
BARIZE - Serviço de Alertas e Notificações
Pilar 6: Operacional - Sistema de Alertas (Webhook Discord/Telegram/Slack)
"""

from sqlalchemy.orm import Session
import httpx
from typing import Optional, Dict, Any
from loguru import logger
import json

from ..models.alerta import AlertaConfig, AlertaDisparado
from ..models.insumo import Insumo
from ..services.estoque_service import EstoqueService


class AlertaService:
    """
    Gerencia alertas do sistema e envio de notificações.
    """

    def __init__(self, db: Session):
        self.db = db

    def verificar_estoque_minimo(self) -> list[AlertaDisparado]:
        """Verifica insumos abaixo do estoque mínimo e dispara alertas."""
        alertas_disparados = []
        alerta_config = (
            self.db.query(AlertaConfig)
            .filter(
                AlertaConfig.tipo == "ESTOQUE_MINIMO",
                AlertaConfig.ativo == True,
            )
            .first()
        )

        if not alerta_config:
            return []

        insumos_criticos = EstoqueService.verificar_estoque_minimo(self.db)

        for insumo in insumos_criticos:
            mensagem = (
                f"⚠️ **Estoque Baixo**: '{insumo.nome}' "
                f"tem apenas {insumo.estoque_atual:.2f} {insumo.unidade_medida} "
                f"(mínimo: {insumo.estoque_minimo:.2f})"
            )

            disparado = AlertaDisparado(
                alerta_config_id=alerta_config.id,
                tipo="ESTOQUE_MINIMO",
                mensagem=mensagem,
            )
            self.db.add(disparado)
            self.db.flush()

            # Envia para canais configurados
            canais = []
            if alerta_config.notificar_discord:
                canais.append("discord")
                self._enviar_discord(mensagem)
            if alerta_config.notificar_telegram:
                canais.append("telegram")
                self._enviar_telegram(mensagem)
            if alerta_config.notificar_slack:
                canais.append("slack")
                self._enviar_slack(mensagem)

            disparado.canal = ",".join(canais) if canais else "sistema"
            disparado.entregue = True
            alertas_disparados.append(disparado)
            logger.warning(f"[ALERTA] {mensagem}")

        self.db.commit()
        return alertas_disparados

    def _enviar_discord(self, mensagem: str) -> bool:
        """Envia notificação para Discord via webhook."""
        from ..config import get_settings
        settings = get_settings()

        webhook_url = settings.DISCORD_WEBHOOK_URL
        if not webhook_url:
            return False

        try:
            payload = {
                "content": mensagem,
                "username": "BARIZE Alertas",
            }
            response = httpx.post(webhook_url, json=payload, timeout=10)
            return response.status_code == 204
        except Exception as e:
            logger.error(f"[ALERTA] Erro ao enviar Discord: {e}")
            return False

    def _enviar_telegram(self, mensagem: str) -> bool:
        """Envia notificação para Telegram."""
        from ..config import get_settings
        settings = get_settings()

        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
            return False

        try:
            url = (
                f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}"
                f"/sendMessage"
            )
            payload = {
                "chat_id": settings.TELEGRAM_CHAT_ID,
                "text": mensagem,
                "parse_mode": "Markdown",
            }
            response = httpx.post(url, json=payload, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"[ALERTA] Erro ao enviar Telegram: {e}")
            return False

    def _enviar_slack(self, mensagem: str) -> bool:
        """Envia notificação para Slack via webhook."""
        from ..config import get_settings
        settings = get_settings()

        if not settings.SLACK_WEBHOOK_URL:
            return False

        try:
            payload = {"text": mensagem}
            response = httpx.post(settings.SLACK_WEBHOOK_URL, json=payload, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"[ALERTA] Erro ao enviar Slack: {e}")
            return False
