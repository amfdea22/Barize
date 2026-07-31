"""
BARIZE - Modelo de Receita (Composição do Produto)
Pilar 3: Banco de Dados - Integridade Referencial com ON DELETE RESTRICT
"""

from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class Receita(Base):
    """
    Define quais insumos compõem cada produto e em qual quantidade.
    Ex: Caipirinha = 50ml Cachaça + 1 un Limão + 10ml Xarope + Gelo
    """
    __tablename__ = "receitas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    produto_id = Column(
        Integer,
        ForeignKey("produtos.id", ondelete="CASCADE"),  # Se produto for deletado, receitas somem
        nullable=False,
        index=True,
    )
    insumo_id = Column(
        Integer,
        ForeignKey("insumos.id", ondelete="RESTRICT"),  # Impede deletar insumo com receita ativa
        nullable=False,
        index=True,
    )
    quantidade_necessaria = Column(Float, nullable=False, default=0.0)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    produto = relationship("Produto", back_populates="receitas")
    insumo = relationship("Insumo", back_populates="receitas")

    __table_args__ = (
        UniqueConstraint("produto_id", "insumo_id", name="uq_receita_produto_insumo"),
    )

    def __repr__(self):
        return f"<Receita(produto={self.produto_id}, insumo={self.insumo_id}, qtd={self.quantidade_necessaria})>"
