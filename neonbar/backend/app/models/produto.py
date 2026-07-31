"""
BARIZE - Modelo de Produto (Item do Cardapio)
Pilar 3: Banco de Dados - Integridade Referencial
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text
from sqlalchemy.orm import relationship
from ..database import Base


class Produto(Base):
    """
    Produto final vendido no bar.
    Ex: Caipirinha, Cerveja Long Neck, Porcao de Batata Frita
    """
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False, index=True, unique=True)
    descricao = Column(Text, nullable=True)
    categoria = Column(String(100), nullable=True, index=True)
    preco_venda = Column(Float, nullable=False, default=0.0)
    codigo_barras = Column(String(50), nullable=True, unique=True)
    imagem = Column(String(10), nullable=True)
    foto_url = Column(String(500), nullable=True)
    ativo = Column(Integer, nullable=False, default=1, index=True)

    modo_preparo = Column(Text, nullable=True)
    tipo_copo = Column(String(100), nullable=True)
    guarnicao = Column(String(200), nullable=True)
    tempo_preparo = Column(Integer, nullable=True)
    dificuldade = Column(String(20), nullable=True)
    teor_alcoolico = Column(Float, nullable=True)
    ingredientes = Column(Text, nullable=True)
    custo_total = Column(Float, nullable=True)
    preco_sugerido = Column(Float, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    receitas = relationship("Receita", back_populates="produto", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Produto(id={self.id}, nome='{self.nome}', preco=R${self.preco_venda:.2f})>"
