from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Recebimento(Base):
    __tablename__ = "recebimentos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nota_fiscal = Column(String(50), nullable=True)
    fornecedor_nome = Column(String(200), nullable=True)
    data_recebimento = Column(Date, nullable=False)
    observacao = Column(Text, nullable=True)
    total_itens = Column(Integer, default=0)
    total_valor = Column(Float, default=0.0)
    created_by = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    itens = relationship("ItemRecebimento", back_populates="recebimento", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Recebimento(id={self.id}, nf='{self.nota_fiscal}', data={self.data_recebimento})>"


class ItemRecebimento(Base):
    __tablename__ = "itens_recebimento"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recebimento_id = Column(Integer, ForeignKey("recebimentos.id", ondelete="CASCADE"), nullable=False)
    insumo_id = Column(Integer, ForeignKey("insumos.id", ondelete="RESTRICT"), nullable=False)
    lote_id = Column(Integer, ForeignKey("lotes.id", ondelete="SET NULL"), nullable=True)
    quantidade = Column(Float, nullable=False)
    custo_unitario = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    data_validade = Column(Date, nullable=True)

    recebimento = relationship("Recebimento", back_populates="itens")
    insumo = relationship("Insumo")
    lote = relationship("Lote")

    def __repr__(self):
        return f"<ItemRecebimento(id={self.id}, insumo={self.insumo_id}, qtd={self.quantidade})>"
