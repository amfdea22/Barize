"""BARIZE - Cardápio Digital (público, sem autenticação)"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.produto import Produto
from ..schemas.produto import ProdutoResponse

router = APIRouter(prefix="/cardapio", tags=["Cardápio Digital"])


@router.get("/", response_model=List[ProdutoResponse])
def listar_cardapio(
    limit: int = 200,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Lista produtos ativos para o cardápio digital (público)."""
    produtos = (
        db.query(Produto)
        .filter(Produto.ativo == 1)
        .order_by(Produto.categoria, Produto.nome)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [ProdutoResponse.model_validate(p) for p in produtos]
