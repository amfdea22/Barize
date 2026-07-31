from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.orm import relationship
from ..database import Base


class Copo(Base):
    __tablename__ = "copos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False, unique=True)
    tipo = Column(String(50), nullable=True)
    capacidade_ml = Column(Integer, nullable=True)
    estoque_atual = Column(Integer, default=0, nullable=False)
    estoque_minimo = Column(Integer, default=0, nullable=False)
    custo_unitario = Column(Float, default=0.0)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quebras = relationship("CopoQuebrado", back_populates="copo")

    def __repr__(self):
        return f"<Copo(id={self.id}, nome='{self.nome}')>"
