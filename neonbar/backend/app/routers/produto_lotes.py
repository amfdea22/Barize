from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.produto_lote import ProdutoLote
from ..schemas.produto_lote import ProdutoLoteCreate, ProdutoLoteUpdate, ProdutoLoteResponse
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/produto-lotes", tags=["Produto Lotes"])


def _load_lotes(query):
    return query.options(joinedload(ProdutoLote.produto))


@router.get("/", response_model=List[ProdutoLoteResponse])
def listar_produto_lotes(
    produto_id: Optional[int] = Query(default=None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = _load_lotes(db.query(ProdutoLote).filter(ProdutoLote.deleted_at.is_(None)))
    if produto_id:
        query = query.filter(ProdutoLote.produto_id == produto_id)
    lotes = query.order_by(ProdutoLote.codigo_lote).offset(offset).limit(limit).all()
    return [ProdutoLoteResponse.model_validate(l) for l in lotes]


@router.get("/vencendo", response_model=List[ProdutoLoteResponse])
def produto_lotes_vencendo(
    dias: int = Query(default=30, ge=1),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoje = date.today()
    limite = hoje + timedelta(days=dias)
    lotes = (
        _load_lotes(db.query(ProdutoLote))
        .filter(
            ProdutoLote.deleted_at.is_(None),
            ProdutoLote.data_validade.isnot(None),
            ProdutoLote.data_validade >= hoje,
            ProdutoLote.data_validade <= limite,
            ProdutoLote.quantidade > 0,
        )
        .order_by(ProdutoLote.data_validade)
        .all()
    )
    return [ProdutoLoteResponse.model_validate(l) for l in lotes]


@router.get("/{lote_id}", response_model=ProdutoLoteResponse)
def obter_produto_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    lote = _load_lotes(db.query(ProdutoLote)).filter(ProdutoLote.id == lote_id, ProdutoLote.deleted_at.is_(None)).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote de produto não encontrado")
    return ProdutoLoteResponse.model_validate(lote)


@router.post("/", response_model=ProdutoLoteResponse, status_code=201)
def criar_produto_lote(
    data: ProdutoLoteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])
    lote = ProdutoLote(**data.model_dump())
    db.add(lote)
    db.commit()
    db.refresh(lote)
    logger.info(f"[PRODUTO-LOTES] Lote '{lote.codigo_lote}' criado (produto={lote.produto_id})")
    return ProdutoLoteResponse.model_validate(lote)


@router.put("/{lote_id}", response_model=ProdutoLoteResponse)
def atualizar_produto_lote(
    lote_id: int,
    data: ProdutoLoteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])
    lote = db.query(ProdutoLote).filter(ProdutoLote.id == lote_id, ProdutoLote.deleted_at.is_(None)).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote de produto não encontrado")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lote, field, value)
    db.commit()
    db.refresh(lote)
    return ProdutoLoteResponse.model_validate(lote)


@router.delete("/{lote_id}")
def excluir_produto_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin"])
    lote = db.query(ProdutoLote).filter(ProdutoLote.id == lote_id, ProdutoLote.deleted_at.is_(None)).first()
    if not lote:
        raise HTTPException(status_code=404, detail="Lote de produto não encontrado")
    lote.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"sucesso": True, "mensagem": f"Lote '{lote.codigo_lote}' excluído"}
