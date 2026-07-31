from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from ..database import Base


class Lote(Base):
    __tablename__ = "lotes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    insumo_id = Column(Integer, ForeignKey("insumos.id", ondelete="RESTRICT"), nullable=False)
    codigo_lote = Column(String(100), nullable=False)
    data_fabricacao = Column(Date, nullable=True)
    data_validade = Column(Date, nullable=True)
    quantidade_inicial = Column(Float, default=0)
    quantidade_atual = Column(Float, default=0)
    custo_unitario = Column(Float, default=0.0)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    insumo = relationship("Insumo")

    def __repr__(self):
        return f"<Lote(id={self.id}, codigo='{self.codigo_lote}', insumo={self.insumo_id})>"
