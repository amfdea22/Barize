"""
BARIZE - Rotas de Pedidos (KDS — Kitchen Display System)
Gerencia os pedidos ativos no Painel em Tempo Real.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger
from datetime import datetime, timezone

from ..database import get_db
from ..models.pedido import Pedido
from ..models.usuario import Usuario
from ..schemas.pedido import PedidoCreate, PedidoUpdate, PedidoUpdateStatus, PedidoResponse
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.get("/ativos", response_model=list[PedidoResponse])
def listar_pedidos_ativos(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna todos os pedidos ativos (Novo, Preparando, Pronto, Entregue — mesa so libera apos pagamento)."""
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.status.in_(["Novo", "Preparando", "Pronto", "Entregue"]))
        .order_by(Pedido.created_at.desc())
        .all()
    )
    return pedidos


@router.get("/", response_model=list[PedidoResponse])
def listar_todos_pedidos(
    limit: int = 50,
    offset: int = 0,
    status: str = None,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retorna todos os pedidos, opcionalmente filtrados por status."""
    query = db.query(Pedido)
    if status:
        query = query.filter(Pedido.status == status)
    pedidos = query.order_by(Pedido.created_at.desc()).offset(offset).limit(limit).all()
    return pedidos


@router.post("/", response_model=PedidoResponse, status_code=201)
def criar_pedido(
    data: PedidoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria um novo pedido (Entrada Manual)."""
    verificar_role(current_user, ["admin", "gerente", "bartender"])

    total = sum(item.quantidade * item.preco for item in data.itens)

    pedido = Pedido(
        mesa=data.mesa,
        cliente=data.cliente,
        status="Novo",
        itens=[item.model_dump() for item in data.itens],
        total=total,
        observacao=data.observacao,
    )
    db.add(pedido)
    db.commit()
    db.refresh(pedido)

    logger.info(
        f"[PEDIDOS] Pedido #{pedido.id} criado por {current_user.username} — "
        f"{len(data.itens)} item(ns), R$ {total:.2f}"
    )
    return pedido


@router.patch("/{pedido_id}/status", response_model=PedidoResponse)
def atualizar_status_pedido(
    pedido_id: int,
    data: PedidoUpdateStatus,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza o status de um pedido (ex: Novo → Preparando → Pronto)."""
    valid_status = ["Novo", "Preparando", "Pronto", "Entregue", "Cancelado", "Arquivado"]
    if data.status not in valid_status:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Válidos: {valid_status}",
        )

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    # ─── Regra de Negócio: Hierarquia de Cancelamento ───────────────────
    if data.status == "Cancelado":
        motivo = (data.motivo or "").strip()

        if pedido.status in ("Preparando", "Pronto"):
            # Cancelamento de pedido em preparo/pronto: requer gerente/admin + motivo
            verificar_role(current_user, ["admin", "gerente"])
            if not motivo or len(motivo) < 3:
                raise HTTPException(
                    status_code=400,
                    detail="Motivo obrigatório para cancelamento de pedidos em preparo ou prontos (mínimo 3 caracteres)",
                )
        else:
            # "Novo": bartender pode cancelar diretamente, mas motivo é recomendado
            verificar_role(current_user, ["admin", "gerente", "bartender"])

        # Estorno de estoque: reverte movimentações vinculadas ao pedido
        from ..models.insumo import Insumo
        from ..models.movimentacao import Movimentacao as MovModel
        from ..services.audit_service import AuditService

        movs = db.query(MovModel).filter(
            MovModel.pedido_id == pedido_id,
            MovModel.tipo == "VENDA",
        ).all()

        estoque_restaurado = 0
        for mov in movs:
            insumo = db.query(Insumo).filter(Insumo.id == mov.insumo_id).first()
            if insumo:
                # mov.quantidade é negativa (saída), então -= negativo = +
                insumo.estoque_atual -= mov.quantidade
                estoque_restaurado += 1

            # Cria movimentação de estorno
            estorno = MovModel(
                insumo_id=mov.insumo_id,
                tipo="AJUSTE",
                quantidade=-mov.quantidade,
                custo_no_momento=mov.custo_no_momento,
                produto_id=mov.produto_id,
                pedido_id=pedido_id,
                observacao=f"Estorno cancelamento Pedido #{pedido_id}. Motivo: {motivo or 'Não informado'}",
                usuario_id=current_user.id,
            )
            db.add(estorno)

        # Registra auditoria
        AuditService.registrar(
            db=db,
            acao="PEDIDO_CANCELADO",
            usuario_id=current_user.id,
            usuario_nome=current_user.nome,
            entidade_tipo="Pedido",
            entidade_id=pedido.id,
            descricao=(
                f"Pedido #{pedido.id} cancelado (status: {pedido.status}). "
                f"{estoque_restaurado} movimentação(ões) estornada(s). Motivo: {motivo or 'Não informado'}"
            ),
            motivo=motivo,
            commit=False,
        )

        logger.warning(
            f"[PEDIDOS] Pedido #{pedido.id} CANCELADO por {current_user.username} "
            f"(era {pedido.status}). Motivo: {motivo or 'N/A'}. "
            f"Estoque restaurado: {estoque_restaurado} movimentações"
        )

    agora = datetime.now(timezone.utc).replace(tzinfo=None)
    pedido.status = data.status
    pedido.updated_at = agora
    if data.status == "Preparando" and not pedido.iniciado_em:
        pedido.iniciado_em = agora
    if data.status == "Pronto" and not pedido.pronto_em:
        pedido.pronto_em = agora
    db.commit()
    db.refresh(pedido)

    logger.info(f"[PEDIDOS] Pedido #{pedido.id} → {data.status}")
    return pedido


@router.patch("/{pedido_id}", response_model=PedidoResponse)
def atualizar_pedido(
    pedido_id: int,
    data: PedidoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza dados de um pedido (mesa, cliente, observacao, itens)."""
    verificar_role(current_user, ["admin", "gerente", "bartender"])

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    if data.mesa is not None:
        pedido.mesa = data.mesa
    if data.cliente is not None:
        pedido.cliente = data.cliente
    if data.observacao is not None:
        pedido.observacao = data.observacao
    if data.itens is not None:
        pedido.itens = [item.model_dump() for item in data.itens]
        pedido.total = sum(item.quantidade * item.preco for item in data.itens)
    if data.tempo_preparo_estimado is not None:
        pedido.tempo_preparo_estimado = data.tempo_preparo_estimado

    pedido.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    db.refresh(pedido)

    logger.info(f"[PEDIDOS] Pedido #{pedido.id} atualizado por {current_user.username}")
    return pedido
