from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from ..models.usuario import Usuario
from ..models.lote import Lote
from ..models.produto_lote import ProdutoLote
from ..models.insumo import Insumo
from ..models.produto import Produto
from ..schemas.etiqueta import EtiquetaItem
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/etiquetas", tags=["Etiquetas"])


@router.get("/", response_model=List[EtiquetaItem])
def listar_etiquetas(
    tipo: Optional[str] = Query(default=None, description="Filtrar por: insumo, produto"),
    lote_id: Optional[int] = Query(default=None),
    produto_id: Optional[int] = Query(default=None),
    insumo_id: Optional[int] = Query(default=None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoje = date.today()
    resultados: List[EtiquetaItem] = []

    if tipo in (None, "insumo"):
        query = db.query(Lote).filter(Lote.deleted_at.is_(None), Lote.quantidade_atual > 0)
        if lote_id:
            query = query.filter(Lote.id == lote_id)
        if insumo_id:
            query = query.filter(Lote.insumo_id == insumo_id)
        for lote in query.all():
            insumo = db.query(Insumo).filter(Insumo.id == lote.insumo_id).first()
            dias = (lote.data_validade - hoje).days if lote.data_validade else None
            resultados.append(EtiquetaItem(
                tipo="insumo",
                item_id=lote.id,
                nome=insumo.nome if insumo else f"Insumo #{lote.insumo_id}",
                categoria=insumo.categoria if insumo else None,
                codigo_lote=lote.codigo_lote,
                data_validade=lote.data_validade,
                data_fabricacao=lote.data_fabricacao,
                quantidade=lote.quantidade_atual,
                unidade_medida=insumo.unidade_medida if insumo else None,
                codigo_barras=insumo.codigo_barras if insumo else None,
                dias_para_vencer=dias if dias and dias >= 0 else None,
            ))

    if tipo in (None, "produto"):
        query = db.query(ProdutoLote).filter(ProdutoLote.deleted_at.is_(None), ProdutoLote.quantidade > 0)
        if lote_id:
            query = query.filter(ProdutoLote.id == lote_id)
        if produto_id:
            query = query.filter(ProdutoLote.produto_id == produto_id)
        for lote in query.all():
            produto = db.query(Produto).filter(Produto.id == lote.produto_id).first()
            dias = (lote.data_validade - hoje).days if lote.data_validade else None
            resultados.append(EtiquetaItem(
                tipo="produto",
                item_id=lote.id,
                nome=produto.nome if produto else f"Produto #{lote.produto_id}",
                categoria=produto.categoria if produto else None,
                codigo_lote=lote.codigo_lote,
                data_validade=lote.data_validade,
                data_fabricacao=lote.data_fabricacao,
                quantidade=lote.quantidade,
                codigo_barras=produto.codigo_barras if produto else None,
                dias_para_vencer=dias if dias and dias >= 0 else None,
            ))

    return resultados[offset:offset + limit]
