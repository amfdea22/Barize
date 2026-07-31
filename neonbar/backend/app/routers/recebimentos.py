from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.insumo import Insumo
from ..models.lote import Lote
from ..models.recebimento import Recebimento, ItemRecebimento
from ..models.movimentacao import Movimentacao
from ..schemas.recebimento import RecebimentoCreate, RecebimentoResponse, RecebimentoRelatorio
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/recebimentos", tags=["Recebimentos"])


@router.get("/", response_model=List[RecebimentoResponse])
def listar_recebimentos(
    data_inicio: Optional[date] = Query(default=None),
    data_fim: Optional[date] = Query(default=None),
    fornecedor: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Recebimento)
    if data_inicio:
        query = query.filter(Recebimento.data_recebimento >= data_inicio)
    if data_fim:
        query = query.filter(Recebimento.data_recebimento <= data_fim)
    if fornecedor:
        query = query.filter(Recebimento.fornecedor_nome.ilike(f"%{fornecedor}%"))
    recebimentos = query.order_by(Recebimento.data_recebimento.desc()).all()
    return [RecebimentoResponse.model_validate(r) for r in recebimentos]


@router.get("/relatorio", response_model=List[RecebimentoRelatorio])
def relatorio_recebimentos(
    data_inicio: Optional[date] = Query(default=None),
    data_fim: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Recebimento)
    if data_inicio:
        query = query.filter(Recebimento.data_recebimento >= data_inicio)
    if data_fim:
        query = query.filter(Recebimento.data_recebimento <= data_fim)
    recebimentos = query.order_by(Recebimento.data_recebimento.desc()).all()
    return [RecebimentoRelatorio.model_validate(r) for r in recebimentos]


@router.get("/{recebimento_id}", response_model=RecebimentoResponse)
def obter_recebimento(
    recebimento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    recebimento = db.query(Recebimento).filter(Recebimento.id == recebimento_id).first()
    if not recebimento:
        raise HTTPException(status_code=404, detail="Recebimento não encontrado")
    return RecebimentoResponse.model_validate(recebimento)


@router.post("/", response_model=RecebimentoResponse, status_code=201)
def criar_recebimento(
    data: RecebimentoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    recebimento = Recebimento(
        nota_fiscal=data.nota_fiscal,
        fornecedor_nome=data.fornecedor_nome,
        data_recebimento=data.data_recebimento,
        observacao=data.observacao,
        total_itens=len(data.itens),
        total_valor=sum(i.quantidade * i.custo_unitario for i in data.itens),
        created_by=current_user.nome,
    )
    db.add(recebimento)
    db.flush()

    for item_data in data.itens:
        insumo = db.query(Insumo).filter(Insumo.id == item_data.insumo_id).first()
        if not insumo:
            raise HTTPException(status_code=404, detail=f"Insumo ID {item_data.insumo_id} não encontrado")

        lote_id = None
        if item_data.data_validade or item_data.lote_codigo:
            codigo_lote = item_data.lote_codigo or f"LOTE-{recebimento.id}-{item_data.insumo_id}"
            lote = Lote(
                insumo_id=item_data.insumo_id,
                codigo_lote=codigo_lote,
                data_validade=item_data.data_validade,
                quantidade_inicial=item_data.quantidade,
                quantidade_atual=item_data.quantidade,
                custo_unitario=item_data.custo_unitario,
            )
            db.add(lote)
            db.flush()
            lote_id = lote.id

        item = ItemRecebimento(
            recebimento_id=recebimento.id,
            insumo_id=item_data.insumo_id,
            lote_id=lote_id,
            quantidade=item_data.quantidade,
            custo_unitario=item_data.custo_unitario,
            total=item_data.quantidade * item_data.custo_unitario,
            data_validade=item_data.data_validade,
        )
        db.add(item)

        # Atualiza estoque e custo médio
        estoque_anterior = insumo.estoque_atual
        custo_total_anterior = estoque_anterior * insumo.custo_unitario
        custo_total_novo = custo_total_anterior + (item_data.quantidade * item_data.custo_unitario)
        novo_estoque = estoque_anterior + item_data.quantidade
        if novo_estoque > 0:
            insumo.custo_unitario = round(custo_total_novo / novo_estoque, 4)
        insumo.estoque_atual = novo_estoque

        # Cria movimentação COMPRA
        mov = Movimentacao(
            insumo_id=item_data.insumo_id,
            tipo="COMPRA",
            quantidade=item_data.quantidade,
            custo_no_momento=item_data.custo_unitario,
            documento_referencia=data.nota_fiscal,
            observacao=data.observacao,
            usuario_id=current_user.id,
        )
        db.add(mov)

    db.commit()
    db.refresh(recebimento)
    logger.info(f"[RECEBIMENTOS] NF '{data.nota_fiscal}' criada com {len(data.itens)} itens")
    return RecebimentoResponse.model_validate(recebimento)
