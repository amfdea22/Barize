"""
BARIZE - Serviço de Auditoria (Audit Trail)
Pilar 5: Segurança e Auditoria - Logs de Auditoria
Toda ação sensível é registrada com: quem fez, quando fez, motivo, estado anterior
"""

from sqlalchemy.orm import Session
from typing import Optional, Any
from datetime import datetime
from loguru import logger

from ..models.audit_log import AuditLog


class AuditService:
    """
    Serviço central de auditoria.
    Registra todas as ações críticas no sistema.
    """

    @staticmethod
    def registrar(
        db: Session,
        acao: str,
        usuario_id: Optional[int] = None,
        usuario_nome: Optional[str] = None,
        entidade_tipo: Optional[str] = None,
        entidade_id: Optional[int] = None,
        descricao: Optional[str] = None,
        estado_anterior: Optional[Any] = None,
        estado_novo: Optional[Any] = None,
        motivo: Optional[str] = None,
        ip_origem: Optional[str] = None,
        commit: bool = True,
    ) -> AuditLog:
        """
        Registra uma ação no log de auditoria.

        Args:
            db: Sessão do banco
            acao: Nome da ação (ex: ITEM_CANCELADO, DESCONTO_APLICADO)
            usuario_id: ID do usuário que executou
            usuario_nome: Nome do usuário
            entidade_tipo: Tipo da entidade afetada (Produto, Insumo, Venda)
            entidade_id: ID da entidade
            descricao: Descrição textual do ocorrido
            estado_anterior: Estado antes da alteração (dict)
            estado_novo: Estado depois da alteração (dict)
            motivo: Motivo informado pelo usuário
            ip_origem: IP de origem da requisição
        """
        log = AuditLog(
            usuario_id=usuario_id,
            usuario_nome=usuario_nome,
            acao=acao,
            entidade_tipo=entidade_tipo,
            entidade_id=entidade_id,
            descricao=descricao,
            estado_anterior=estado_anterior,
            estado_novo=estado_novo,
            motivo=motivo,
            ip_origem=ip_origem,
        )
        db.add(log)
        if commit:
            db.commit()
            db.refresh(log)
        else:
            db.flush()

        logger.info(
            f"[AUDIT] {acao} | Usuário: {usuario_nome} ({usuario_id}) | "
            f"Entidade: {entidade_tipo}#{entidade_id} | Motivo: {motivo}"
        )
        return log

    @staticmethod
    def listar(
        db: Session,
        limit: int = 100,
        offset: int = 0,
        acao: Optional[str] = None,
        usuario_id: Optional[int] = None,
        entidade_tipo: Optional[str] = None,
    ) -> list[AuditLog]:
        """Lista logs de auditoria com filtros opcionais."""
        query = db.query(AuditLog)

        if acao:
            query = query.filter(AuditLog.acao == acao)
        if usuario_id:
            query = query.filter(AuditLog.usuario_id == usuario_id)
        if entidade_tipo:
            query = query.filter(AuditLog.entidade_tipo == entidade_tipo)

        return (
            query
            .order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
