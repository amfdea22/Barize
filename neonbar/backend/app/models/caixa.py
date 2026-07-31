"""
BARIZE - Modelos de Caixa e Fechamento
Pilar 6: Operacional - Rotina de Fechamento de Caixa
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Caixa(Base):
    """
    Representa uma sessão de caixa (abertura/fechamento do dia).
    """
    __tablename__ = "caixas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, default="ABERTO")  # ABERTO, FECHADO
    saldo_inicial = Column(Float, nullable=False, default=0.0)
    saldo_final_esperado = Column(Float, nullable=True)
    saldo_final_declarado = Column(Float, nullable=True)
    diferenca = Column(Float, nullable=True)

    data_abertura = Column(DateTime, server_default=func.now(), nullable=False)
    data_fechamento = Column(DateTime, nullable=True)

    # Valores declarados por forma de pagamento
    valores_declarados = Column(JSON, nullable=True)
    # Ex: {"dinheiro": 1500.00, "cartao_credito": 3200.00, "cartao_debito": 1800.00, "pix": 2500.00}

    observacao = Column(Text, nullable=True)

    # Relationships
    fechamentos = relationship("FechamentoCaixa", back_populates="caixa", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Caixa(id={self.id}, status='{self.status}', abertura={self.data_abertura})>"


class FechamentoCaixa(Base):
    """
    Detalhamento do fechamento de caixa por forma de pagamento.
    """
    __tablename__ = "fechamentos_caixa"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    caixa_id = Column(
        Integer,
        ForeignKey("caixas.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    forma_pagamento = Column(String(50), nullable=False)  # dinheiro, cartao_credito, cartao_debito, pix
    valor_sistema = Column(Float, nullable=False, default=0.0)  # O que o sistema calculou
    valor_declarado = Column(Float, nullable=False, default=0.0)  # O que o operador declarou
    diferenca = Column(Float, nullable=False, default=0.0)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship
    caixa = relationship("Caixa", back_populates="fechamentos")

    def __repr__(self):
        return f"<FechamentoCaixa(caixa={self.caixa_id}, pagamento='{self.forma_pagamento}', diff={self.diferenca})>"
