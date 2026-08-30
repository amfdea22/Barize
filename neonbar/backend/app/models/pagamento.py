from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from ..database import Base

class Pagamento(Base):
    __tablename__ = "pagamentos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    venda_id = Column(Integer, nullable=True)
    forma_pagamento = Column(String(30), nullable=False)
    valor = Column(Float, nullable=False)
    valor_servico_pago = Column(Float, default=0.0)
    valor_couvert_pago = Column(Float, default=0.0)
    isencao_servico = Column(Boolean, default=False)
    isencao_couvert = Column(Boolean, default=False)
    motivo_isencao = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
