"""
BARIZE - Modelos de Sistema de Alertas
Pilar 6: Operacional - Sistema de Alertas (Estoque Mínimo, Webhook)
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text, Boolean
from ..database import Base


class AlertaConfig(Base):
    """
    Configuração de alertas do sistema.
    Define regras para disparo de notificações.
    """
    __tablename__ = "alertas_config"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    tipo = Column(String(50), nullable=False, index=True)
    # Tipos: ESTOQUE_MINIMO, VENDA_ALTA, PERDA_EXCESSIVA
    ativo = Column(Boolean, nullable=False, default=True)
    config_json = Column(String(500), nullable=True)  # Config específica em JSON string

    # Canais de notificação
    notificar_discord = Column(Boolean, default=False)
    notificar_telegram = Column(Boolean, default=False)
    notificar_slack = Column(Boolean, default=False)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<AlertaConfig(id={self.id}, nome='{self.nome}', tipo='{self.tipo}')>"


class AlertaDisparado(Base):
    """
    Histórico de alertas que foram disparados.
    """
    __tablename__ = "alertas_disparados"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    alerta_config_id = Column(Integer, nullable=True, index=True)
    tipo = Column(String(50), nullable=False, index=True)
    mensagem = Column(Text, nullable=False)
    canal = Column(String(50), nullable=True)  # discord, telegram, slack, sistema
    entregue = Column(Boolean, default=False)
    erro_msg = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<AlertaDisparado(id={self.id}, tipo='{self.tipo}', mensagem='{self.mensagem[:50]}')>"
