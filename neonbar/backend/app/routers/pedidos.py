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
    """Retorna todos os pedidos com status Novo ou Preparando."""
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.status.in_(["Novo", "Preparando"]))
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
    valid_status = ["Novo", "Preparando", "Pronto", "Entregue", "Cancelado"]
    if data.status not in valid_status:
        raise HTTPException(
            status_code=400,
            detail=f"Status inválido. Válidos: {valid_status}",
        )

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

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
