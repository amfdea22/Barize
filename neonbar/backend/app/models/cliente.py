from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from ..database import Base

class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    cpf_cnpj = Column(String(20), nullable=True, unique=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(150), nullable=True)
    data_nascimento = Column(String(10), nullable=True)
    acumulado_gastos = Column(Float, default=0.0)
    observacao = Column(String(500), nullable=True)
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
