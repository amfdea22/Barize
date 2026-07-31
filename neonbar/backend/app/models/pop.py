from sqlalchemy import Column, Integer, String, DateTime, func, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class POP(Base):
    __tablename__ = "pops"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    titulo = Column(String(200), nullable=False)
    descricao = Column(Text, nullable=True)
    categoria = Column(String(100), nullable=True)
    passos = Column(JSON, nullable=True)
    frequencia = Column(String(20), nullable=True, default="diario")
    momento = Column(String(20), nullable=True)
    exigencia_fluxo = Column(JSON, nullable=True)
    setor = Column(String(100), nullable=True)
    ordem = Column(Integer, nullable=True, default=0)
    ativo = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    execucoes = relationship("ExecucaoPOP", back_populates="pop", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<POP(id={self.id}, titulo='{self.titulo}')>"


class ExecucaoPOP(Base):
    __tablename__ = "execucoes_pop"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pop_id = Column(Integer, ForeignKey("pops.id", ondelete="CASCADE"), nullable=False)
    realizado_por = Column(String(100), nullable=True)
    realizado_em = Column(DateTime, server_default=func.now(), nullable=False)
    status = Column(String(20), nullable=False, default="pendente")
    observacao = Column(Text, nullable=True)

    pop = relationship("POP", back_populates="execucoes")

    def __repr__(self):
        return f"<ExecucaoPOP(id={self.id}, pop={self.pop_id}, status='{self.status}')>"
