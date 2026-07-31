from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.lote import Lote
from ..schemas.lote import LoteCreate, LoteUpdate, LoteResponse
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/lotes", tags=["Lotes"])


@router.get("/", response_model=List[LoteResponse])
def listar_lotes(
    insumo_id: Optional[int] = Query(default=None),
    proximo_vencimento: Optional[bool] = Query(default=False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Lote).filter(Lote.deleted_at.is_(None))
    if insumo_id:
        query = query.filter(Lote.insumo_id == insumo_id)
    if proximo_vencimento:
        hoje = date.today()
        limite = hoje + timedelta(days=30)
        query = query.filter(
            Lote.data_validade.isnot(None),
            Lote.data_validade >= hoje,
            Lote.data_validade <= limite,
            Lote.quantidade_atual > 0,
        )
    lotes = query.order_by(Lote.codigo_lote).offset(offset).limit(limit).all()
    return [LoteResponse.model_validate(l) for l in lotes]


@router.get("/vencendo", response_model=List[LoteResponse])
def lotes_vencendo(
    dias: int = Query(default=30, ge=1),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoje = date.today()
    limite = hoje + timedelta(days=dias)
    lotes = (
        db.query(Lote)
        .filter(
            Lote.deleted_at.is_(None),
            Lote.data_validade.isnot(None),
            Lote.data_validade >= hoje,
            Lote.data_validade <= limite,
            Lote.quantidade_atual > 0,
        )
        .order_by(Lote.data_validade)
        .all()
    )
    return [LoteResponse.model_validate(l) for l in lotes]


@router.get("/{lote_id}", response_model=LoteResponse)
def obter_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    lote = db.query(Lote).filter(Lote.id == lote_id, Lote.deleted_at.is_(None)).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    return LoteResponse.model_validate(lote)


@router.post("/", response_model=LoteResponse, status_code=201)
def criar_lote(
    data: LoteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])
    lote = Lote(**data.model_dump())
    db.add(lote)
    db.commit()
    db.refresh(lote)
    logger.info(f"[LOTES] Lote '{lote.codigo_lote}' criado (insumo={lote.insumo_id})")
    return LoteResponse.model_validate(lote)


@router.put("/{lote_id}", response_model=LoteResponse)
def atualizar_lote(
    lote_id: int,
    data: LoteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])
    lote = db.query(Lote).filter(Lote.id == lote_id, Lote.deleted_at.is_(None)).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lote, field, value)
    db.commit()
    db.refresh(lote)
    return LoteResponse.model_validate(lote)


@router.delete("/{lote_id}")
def excluir_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin"])
    lote = db.query(Lote).filter(Lote.id == lote_id, Lote.deleted_at.is_(None)).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    lote.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"sucesso": True, "mensagem": f"Lote '{lote.codigo_lote}' excluído"}
