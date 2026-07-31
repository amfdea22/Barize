from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Pagamento(Base):
    __tablename__ = "pagamentos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    venda_id = Column(Integer, nullable=True)
    forma_pagamento = Column(String(30), nullable=False)
    valor = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
