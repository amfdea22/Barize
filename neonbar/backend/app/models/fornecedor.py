from sqlalchemy import Column, Integer, String, DateTime, func, Text, Boolean
from ..database import Base


class Fornecedor(Base):
    __tablename__ = "fornecedores"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False, index=True)
    cnpj = Column(String(18), nullable=True, unique=True)
    contato = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    endereco = Column(Text, nullable=True)
    prazo_entrega_dias = Column(Integer, nullable=True, default=7)
    observacao = Column(Text, nullable=True)
    ativo = Column(Integer, nullable=False, default=1)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<Fornecedor(id={self.id}, nome='{self.nome}')>"
