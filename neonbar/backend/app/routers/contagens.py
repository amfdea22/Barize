from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.insumo import Insumo
from ..models.contagem import Contagem, ItemContagem
from ..models.movimentacao import Movimentacao
from ..schemas.contagem import (
    ContagemCreate, ContagemResponse, ContagemRelatorio,
    ItemContagemUpdate, ItemContagemResponse,
)
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/contagens", tags=["Contagens"])


@router.get("/", response_model=List[ContagemResponse])
def listar_contagens(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    contagens = db.query(Contagem).order_by(Contagem.data_contagem.desc()).all()
    return [ContagemResponse.model_validate(c) for c in contagens]


@router.get("/relatorio", response_model=List[ContagemRelatorio])
def relatorio_contagens(
    data_inicio: Optional[date] = Query(default=None),
    data_fim: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Contagem)
    if data_inicio:
        query = query.filter(Contagem.data_contagem >= data_inicio)
    if data_fim:
        query = query.filter(Contagem.data_contagem <= data_fim)
    contagens = query.order_by(Contagem.data_contagem.desc()).all()
    return [ContagemRelatorio.model_validate(c) for c in contagens]


@router.get("/historico", response_model=List[ContagemRelatorio])
def historico_contagens(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    contagens = (
        db.query(Contagem)
        .order_by(Contagem.created_at.desc())
        .limit(limit)
        .all()
    )
    return [ContagemRelatorio.model_validate(c) for c in contagens]


@router.get("/{contagem_id}", response_model=ContagemResponse)
def obter_contagem(
    contagem_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    contagem = db.query(Contagem).filter(Contagem.id == contagem_id).first()
    if not contagem:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")
    return ContagemResponse.model_validate(contagem)


@router.post("/", response_model=ContagemResponse, status_code=201)
def criar_contagem(
    data: ContagemCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    contagem = Contagem(
        data_contagem=data.data_contagem,
        observacao=data.observacao,
        status="em_andamento",
        created_by=current_user.nome,
    )
    db.add(contagem)
    db.flush()

    insumos = db.query(Insumo).filter(Insumo.ativo == 1).all()
    for insumo in insumos:
        item = ItemContagem(
            contagem_id=contagem.id,
            insumo_id=insumo.id,
            quantidade_sistema=insumo.estoque_atual,
            quantidade_contada=0.0,
            diferenca=0.0,
        )
        db.add(item)

    db.commit()
    db.refresh(contagem)
    logger.info(f"[CONTAGENS] Contagem #{contagem.id} criada ({len(insumos)} itens)")
    return ContagemResponse.model_validate(contagem)


@router.put("/{contagem_id}/itens/{item_id}", response_model=ItemContagemResponse)
def atualizar_item_contagem(
    contagem_id: int,
    item_id: int,
    data: ItemContagemUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    contagem = db.query(Contagem).filter(Contagem.id == contagem_id).first()
    if not contagem:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")

    item = (
        db.query(ItemContagem)
        .filter(ItemContagem.id == item_id, ItemContagem.contagem_id == contagem_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item de contagem não encontrado")

    item.quantidade_contada = data.quantidade_contada
    item.diferenca = round(data.quantidade_contada - item.quantidade_sistema, 4)
    if data.observacao is not None:
        item.observacao = data.observacao
    item.status = "conferido"

    db.commit()
    db.refresh(item)
    return ItemContagemResponse.model_validate(item)


@router.put("/{contagem_id}/concluir", response_model=ContagemResponse)
def concluir_contagem(
    contagem_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    contagem = db.query(Contagem).filter(Contagem.id == contagem_id).first()
    if not contagem:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")
    if contagem.status != "em_andamento":
        raise HTTPException(status_code=400, detail=f"Contagem já está '{contagem.status}'")

    divergencias = (
        db.query(ItemContagem)
        .filter(
            ItemContagem.contagem_id == contagem_id,
            ItemContagem.diferenca != 0,
        )
        .count()
    )

    contagem.status = "concluida"
    contagem.total_divergencias = divergencias
    db.commit()
    db.refresh(contagem)
    logger.info(f"[CONTAGENS] Contagem #{contagem_id} concluída ({divergencias} divergências)")
    return ContagemResponse.model_validate(contagem)


@router.put("/{contagem_id}/aprovar", response_model=ContagemResponse)
def aprovar_contagem(
    contagem_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin"])

    contagem = db.query(Contagem).filter(Contagem.id == contagem_id).first()
    if not contagem:
        raise HTTPException(status_code=404, detail="Contagem não encontrada")
    if contagem.status not in ("concluida", "em_andamento"):
        raise HTTPException(status_code=400, detail=f"Contagem não pode ser aprovada (status: '{contagem.status}')")

    itens = (
        db.query(ItemContagem)
        .filter(
            ItemContagem.contagem_id == contagem_id,
            ItemContagem.diferenca != 0,
            ItemContagem.status != "ajustado",
        )
        .all()
    )

    for item in itens:
        insumo = db.query(Insumo).filter(Insumo.id == item.insumo_id).first()
        if not insumo:
            continue

        item.status = "ajustado"

        mov = Movimentacao(
            insumo_id=item.insumo_id,
            tipo="AJUSTE",
            quantidade=item.diferenca,
            custo_no_momento=insumo.custo_unitario,
            observacao=f"Ajuste por contagem #{contagem_id}: sistema={item.quantidade_sistema}, contado={item.quantidade_contada}",
            usuario_id=current_user.id,
        )
        db.add(mov)

        insumo.estoque_atual = item.quantidade_contada

    contagem.status = "aprovada"
    contagem.aprovado_por = current_user.nome
    db.commit()
    db.refresh(contagem)
    logger.info(f"[CONTAGENS] Contagem #{contagem_id} aprovada ({len(itens)} ajustes)")
    return ContagemResponse.model_validate(contagem)
