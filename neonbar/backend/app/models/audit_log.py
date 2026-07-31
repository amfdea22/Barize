"""
BARIZE - Modelo de Auditoria (Audit Trail)
Pilar 5: Segurança e Auditoria - Logs de Auditoria
Toda ação sensível (cancelar item, aplicar desconto, excluir) é registrada.
"""

from sqlalchemy import Column, Integer, String, DateTime, func, Text, JSON
from ..database import Base
from datetime import datetime


class AuditLog(Base):
    """
    Registro imutável de todas as ações críticas no sistema.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, nullable=True, index=True)
    usuario_nome = Column(String(200), nullable=True)
    acao = Column(String(100), nullable=False, index=True)
    # Ações: ITEM_CANCELADO, DESCONTO_APLICADO, PRODUTO_EXCLUIDO,
    #        INSUMO_AJUSTADO, FECHAMENTO_CAIXA, USUARIO_CRIADO,
    #        PERMISSAO_ALTERADA, VENDA_CANCELADA
    entidade_tipo = Column(String(50), nullable=True)  # Produto, Insumo, Venda, Usuario
    entidade_id = Column(Integer, nullable=True)
    descricao = Column(Text, nullable=True)
    estado_anterior = Column(JSON, nullable=True)  # Dados antes da alteração
    estado_novo = Column(JSON, nullable=True)      # Dados depois da alteração
    motivo = Column(Text, nullable=True)            # Motivo informado pelo usuário
    ip_origem = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    def __repr__(self):
        return f"<AuditLog(id={self.id}, acao='{self.acao}', usuario={self.usuario_nome})>"
