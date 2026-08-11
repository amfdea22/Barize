from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.insumo import Insumo
from ..models.produto import Produto
from ..models.receita import Receita
from ..models.producao import Producao, ItemProducao
from ..models.movimentacao import Movimentacao
from ..schemas.producao import ProducaoCreate, ProducaoResponse, ProducaoRelatorio
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/producoes", tags=["Produções"])


@router.get("/", response_model=List[ProducaoResponse])
def listar_producoes(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    producoes = (
        db.query(Producao)
        .order_by(Producao.data_producao.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [ProducaoResponse.model_validate(p) for p in producoes]


@router.get("/relatorio", response_model=List[ProducaoRelatorio])
def relatorio_producoes(
    data_inicio: Optional[date] = Query(default=None),
    data_fim: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Producao)
    if data_inicio:
        query = query.filter(Producao.data_producao >= data_inicio)
    if data_fim:
        query = query.filter(Producao.data_producao <= data_fim)
    producoes = query.order_by(Producao.data_producao.desc()).all()
    return [ProducaoRelatorio.model_validate(p) for p in producoes]


@router.get("/{producao_id}", response_model=ProducaoResponse)
def obter_producao(
    producao_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    producao = db.query(Producao).filter(Producao.id == producao_id).first()
    if not producao:
        raise HTTPException(status_code=404, detail="Produção não encontrada")
    return ProducaoResponse.model_validate(producao)


@router.post("/", response_model=ProducaoResponse, status_code=201)
def criar_producao(
    data: ProducaoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    producao = Producao(
        data_producao=data.data_producao,
        observacao=data.observacao,
        custo_total=0.0,
        created_by=current_user.nome,
    )
    db.add(producao)
    db.flush()

    custo_total_geral = 0.0

    for item_data in data.itens:
        produto = db.query(Produto).filter(Produto.id == item_data.produto_id, Produto.ativo == 1).first()
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto ID {item_data.produto_id} não encontrado")

        receitas = db.query(Receita).filter(Receita.produto_id == produto.id).all()
        if not receitas:
            raise HTTPException(status_code=400, detail=f"Produto '{produto.nome}' não possui receita cadastrada")

        custo_unitario = 0.0
        for i, r in enumerate(receitas):
            insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
            if not insumo:
                raise HTTPException(status_code=404, detail=f"Insumo ID {r.insumo_id} não encontrado")

            consumo = r.quantidade_necessaria * item_data.quantidade_produzida
            if insumo.estoque_atual < consumo:
                raise HTTPException(
                    status_code=400,
                    detail=f"Estoque insuficiente de '{insumo.nome}': tem {insumo.estoque_atual}, precisa de {consumo}",
                )

            custo_insumo = insumo.custo_unitario * consumo
            custo_unitario += insumo.custo_unitario * r.quantidade_necessaria

            insumo.estoque_atual -= consumo

            mov = Movimentacao(
                insumo_id=insumo.id,
                tipo="VENDA",
                quantidade=-consumo,
                custo_no_momento=insumo.custo_unitario,
                produto_id=produto.id,
                quantidade_produto=(item_data.quantidade_produzida if i == 0 else None),
                observacao=f"Produção #{producao.id}: {item_data.quantidade_produzida}x '{produto.nome}'",
                usuario_id=current_user.id,
            )
            db.add(mov)

        custo_unitario = round(custo_unitario, 4)
        custo_total_item = round(custo_unitario * item_data.quantidade_produzida, 4)
        custo_total_geral += custo_total_item

        item_prod = ItemProducao(
            producao_id=producao.id,
            produto_id=produto.id,
            quantidade_produzida=item_data.quantidade_produzida,
            custo_unitario=custo_unitario,
            custo_total=custo_total_item,
        )
        db.add(item_prod)

    producao.custo_total = round(custo_total_geral, 4)
    db.commit()
    db.refresh(producao)
    logger.info(f"[PRODUCAO] Produção #{producao.id} criada: {len(data.itens)} produtos, custo R${producao.custo_total}")
    return ProducaoResponse.model_validate(producao)
