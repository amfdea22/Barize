from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from loguru import logger

from ..database import get_db
from ..models.pagamento import Pagamento
from ..models.usuario import Usuario
from ..schemas.pagamento import PagamentoCreate, PagamentoResponse
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/pagamentos", tags=["Pagamentos"])


@router.get("/", response_model=List[PagamentoResponse])
def listar_pagamentos(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])
    pagamentos = db.query(Pagamento).order_by(Pagamento.created_at.desc()).offset(offset).limit(limit).all()
    return pagamentos


@router.get("/{pagamento_id}", response_model=PagamentoResponse)
def obter_pagamento(
    pagamento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pagamento = db.query(Pagamento).filter(Pagamento.id == pagamento_id).first()
    if not pagamento:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return pagamento


@router.post("/", response_model=PagamentoResponse, status_code=201)
def criar_pagamento(
    data: PagamentoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente", "bartender"])
    pagamento = Pagamento(
        venda_id=data.venda_id,
        forma_pagamento=data.forma_pagamento,
        valor=data.valor,
    )
    db.add(pagamento)
    db.commit()
    db.refresh(pagamento)
    logger.info(f"[PAGAMENTOS] Pagamento #{pagamento.id} criado: R${data.valor:.2f} ({data.forma_pagamento})")
    return pagamento


@router.get("/por-venda/{venda_id}", response_model=List[PagamentoResponse])
def listar_pagamentos_por_venda(
    venda_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pagamentos = (
        db.query(Pagamento)
        .filter(Pagamento.venda_id == venda_id)
        .order_by(Pagamento.created_at.desc())
        .all()
    )
    return pagamentos
