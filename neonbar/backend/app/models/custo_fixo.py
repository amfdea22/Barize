from sqlalchemy import Column, Integer, String, Float, DateTime, func, Text
from ..database import Base


class CustoFixo(Base):
    __tablename__ = "custos_fixos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    categoria = Column(String(100), nullable=True)
    valor = Column(Float, nullable=False, default=0.0)
    dia_vencimento = Column(Integer, nullable=True)
    mes_referencia = Column(String(7), nullable=True)
    ativo = Column(Integer, nullable=False, default=1)
    observacao = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<CustoFixo(id={self.id}, nome='{self.nome}', valor=R${self.valor:.2f})>"
