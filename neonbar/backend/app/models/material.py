from sqlalchemy import Column, Integer, String, Float, DateTime, func
from ..database import Base


class Material(Base):
    __tablename__ = "materiais"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), nullable=False, unique=True)
    categoria = Column(String(50), nullable=True)
    estoque_atual = Column(Integer, default=0, nullable=False)
    estoque_minimo = Column(Integer, default=0, nullable=False)
    custo_unitario = Column(Float, default=0.0)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Material(id={self.id}, nome='{self.nome}')>"
