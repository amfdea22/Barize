"""
BARIZE - Modelo de Movimentação de Estoque
Pilar 3: Banco de Dados - Histórico completo de entradas e saídas
Pilar 6: Operacional - Cálculo de CMV
"""

from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, func, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Movimentacao(Base):
    """
    Registro de toda movimentação de estoque.
    - COMPRA: entrada de mercadoria (aumenta estoque)
    - VENDA: saída por venda de produto (diminui estoque)
    - AJUSTE: correção manual de inventário (físico vs sistema)
    - PERDA: quebra, vencimento ou extravio
    """
    __tablename__ = "movimentacoes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    insumo_id = Column(
        Integer,
        ForeignKey("insumos.id", ondelete="RESTRICT"),  # Não permite deletar insumo com movs
        nullable=False,
        index=True,
    )
    tipo = Column(String(20), nullable=False, index=True)  # COMPRA, VENDA, AJUSTE, PERDA
    quantidade = Column(Float, nullable=False)  # Positiva para entrada, negativa para saída
    custo_no_momento = Column(Float, nullable=False, default=0.0)
    # Para VENDA, vincula ao produto vendido
    produto_id = Column(
        Integer,
        ForeignKey("produtos.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Documento de referência (NF, pedido, etc.)
    documento_referencia = Column(String(100), nullable=True)
    observacao = Column(Text, nullable=True)
    # Quantidade de produtos vendidos (apenas para VENDA)
    quantidade_produto = Column(Float, nullable=True)
    # Quem registrou a movimentação
    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
    )
    data = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    insumo = relationship("Insumo", back_populates="movimentacoes")
    produto = relationship("Produto")
    usuario = relationship("Usuario")

    def __repr__(self):
        return f"<Movimentacao(id={self.id}, tipo='{self.tipo}', qtd={self.quantidade}, insumo={self.insumo_id})>"
