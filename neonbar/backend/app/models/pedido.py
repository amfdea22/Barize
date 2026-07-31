"""
BARIZE - Modelo de Pedido (KDS — Kitchen Display System)
"""

from sqlalchemy import Column, Integer, String, DateTime, JSON, Float
from sqlalchemy.sql import func
from ..database import Base


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mesa = Column(String(20), nullable=True)
    cliente = Column(String(100), nullable=True)
    status = Column(String(20), default="Novo", nullable=False, index=True)      # Novo | Preparando | Pronto | Entregue
    itens = Column(JSON, default=list, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    observacao = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    iniciado_em = Column(DateTime(timezone=True), nullable=True)
    pronto_em = Column(DateTime(timezone=True), nullable=True)
    tempo_preparo_estimado = Column(Integer, nullable=True)  # minutos estimados
