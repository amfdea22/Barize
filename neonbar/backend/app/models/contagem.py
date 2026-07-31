from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Contagem(Base):
    __tablename__ = "contagens"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    data_contagem = Column(Date, nullable=False)
    status = Column(String(20), default="em_andamento")  # em_andamento, concluida, aprovada
    observacao = Column(Text, nullable=True)
    created_by = Column(String(50), nullable=True)
    aprovado_por = Column(String(50), nullable=True)
    total_divergencias = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    itens = relationship("ItemContagem", back_populates="contagem", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Contagem(id={self.id}, data={self.data_contagem}, status='{self.status}')>"


class ItemContagem(Base):
    __tablename__ = "itens_contagem"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    contagem_id = Column(Integer, ForeignKey("contagens.id", ondelete="CASCADE"), nullable=False)
    insumo_id = Column(Integer, ForeignKey("insumos.id", ondelete="RESTRICT"), nullable=False)
    quantidade_sistema = Column(Float, default=0.0)
    quantidade_contada = Column(Float, default=0.0)
    diferenca = Column(Float, default=0.0)
    status = Column(String(20), default="pendente")  # pendente, conferido, ajustado
    observacao = Column(Text, nullable=True)

    contagem = relationship("Contagem", back_populates="itens")
    insumo = relationship("Insumo")

    def __repr__(self):
        return f"<ItemContagem(id={self.id}, insumo={self.insumo_id}, diff={self.diferenca})>"
