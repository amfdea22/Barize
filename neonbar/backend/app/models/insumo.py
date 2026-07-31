"""
BARIZE - Modelo de Insumo (Matéria-Prima)
Pilar 3: Banco de Dados - Integridade Referencial
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base
from sqlalchemy import Date


class Insumo(Base):
    """
    Representa um insumo/ingrediente no estoque do bar.
    Ex: Vodka, Limão, Xarope de Açúcar, Cerveja, Gelo
    """
    __tablename__ = "insumos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False, index=True, unique=True)
    descricao = Column(String(500), nullable=True)
    categoria = Column(String(100), nullable=True, index=True)  # Bebida, Insumo, Embalagem
    unidade_medida = Column(String(20), nullable=False, default="un")  # ml, g, un, l
    estoque_atual = Column(Float, nullable=False, default=0.0, index=True)
    estoque_minimo = Column(Float, nullable=False, default=0.0)
    custo_unitario = Column(Float, nullable=False, default=0.0)
    ativo = Column(Integer, nullable=False, default=1, index=True)  # Soft delete
    controlado = Column(Integer, default=0)  # 0=não, 1=sim
    codigo_barras = Column(String(50), nullable=True, unique=True)
    validade_dias = Column(Integer, nullable=True)  # default shelf life in days

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    receitas = relationship("Receita", back_populates="insumo", cascade="all, delete-orphan")
    movimentacoes = relationship("Movimentacao", back_populates="insumo")

    def __repr__(self):
        return f"<Insumo(id={self.id}, nome='{self.nome}', estoque={self.estoque_atual})>"
