from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Date
from sqlalchemy.orm import relationship
from ..database import Base


class ProdutoLote(Base):
    __tablename__ = "produto_lotes"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    produto_id = Column(Integer, ForeignKey("produtos.id", ondelete="RESTRICT"), nullable=False)
    codigo_lote = Column(String(100), nullable=False)
    data_fabricacao = Column(Date, nullable=True)
    data_validade = Column(Date, nullable=True)
    quantidade = Column(Float, default=0)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    produto = relationship("Produto")

    def __repr__(self):
        return f"<ProdutoLote(id={self.id}, codigo='{self.codigo_lote}', produto={self.produto_id})>"
