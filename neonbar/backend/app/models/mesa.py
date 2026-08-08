"""
BARIZE - Modelo de Mesa (layout do salão)
Mesas e balcões configuráveis para o PDV (substitui constante MESAS hardcoded).
"""

from sqlalchemy import Column, Integer, String, DateTime, func
from ..database import Base


class Mesa(Base):
    """Mesa ou balcão do salão, configurável pelo admin."""
    __tablename__ = "mesas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(20), unique=True, nullable=False, index=True)
    local = Column(String(50), nullable=True)  # Mesa, Balcão, Terraço, etc.
    ativo = Column(Integer, nullable=False, default=1, index=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Mesa(id={self.id}, nome='{self.nome}', ativo={self.ativo})>"
