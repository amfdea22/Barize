from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from ..database import Base


class CopoQuebrado(Base):
    __tablename__ = "copos_quebrados"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    copo_id = Column(Integer, ForeignKey("copos.id", ondelete="RESTRICT"), nullable=False)
    quantidade = Column(Integer, nullable=False, default=1)
    motivo = Column(Text, nullable=True)
    valor_total = Column(Float, default=0.0)
    registrado_por = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    copo = relationship("Copo", back_populates="quebras")

    def __repr__(self):
        return f"<CopoQuebrado(id={self.id}, copo_id={self.copo_id}, qtd={self.quantidade})>"
