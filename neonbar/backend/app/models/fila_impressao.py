"""
BARIZE - Fila de Impressão (Worker)
Pilar 4: Integração de Hardware - Service Worker de Impressão
"""

from sqlalchemy import Column, Integer, String, DateTime, func, Text, JSON
from ..database import Base


class FilaImpressao(Base):
    """
    Fila de trabalhos de impressão.
    O worker lê desta tabela e envia para a impressora térmica.
    """
    __tablename__ = "fila_impressao"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tipo = Column(String(50), nullable=False, index=True)
    # Tipos: COMANDA, FECHAMENTO, RELATORIO, ETIQUETA
    status = Column(String(20), nullable=False, default="PENDENTE", index=True)
    # Status: PENDENTE, IMPRIMINDO, CONCLUIDO, ERRO
    dados_json = Column(JSON, nullable=False)  # Conteúdo completo da comanda em JSON
    impressora_destino = Column(String(100), nullable=True)  # Nome/IP da impressora
    tentativas = Column(Integer, nullable=False, default=0)
    erro_msg = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<FilaImpressao(id={self.id}, tipo='{self.tipo}', status='{self.status}')>"
