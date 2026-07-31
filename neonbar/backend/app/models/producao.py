from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Producao(Base):
    __tablename__ = "producoes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    data_producao = Column(Date, nullable=False)
    observacao = Column(Text, nullable=True)
    custo_total = Column(Float, default=0.0)
    created_by = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    itens = relationship("ItemProducao", back_populates="producao", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Producao(id={self.id}, data={self.data_producao})>"


class ItemProducao(Base):
    __tablename__ = "itens_producao"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    producao_id = Column(Integer, ForeignKey("producoes.id", ondelete="CASCADE"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id", ondelete="RESTRICT"), nullable=False)
    quantidade_produzida = Column(Integer, default=1)
    custo_unitario = Column(Float, default=0.0)
    custo_total = Column(Float, default=0.0)

    producao = relationship("Producao", back_populates="itens")
    produto = relationship("Produto")

    def __repr__(self):
        return f"<ItemProducao(id={self.id}, produto={self.produto_id}, qtd={self.quantidade_produzida})>"
