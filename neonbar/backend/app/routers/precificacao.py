from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.produto import Produto
from ..models.insumo import Insumo
from ..models.receita import Receita
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/precificacao", tags=["Precificação"])


def calcular_custo_dose(db: Session, produto_id: int) -> float:
    receitas = db.query(Receita).filter(Receita.produto_id == produto_id).all()
    total = 0.0
    for r in receitas:
        insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
        if insumo and insumo.custo_unitario:
            total += r.quantidade_necessaria * insumo.custo_unitario
    return round(total, 2)


def calcular_preco_sugerido(custo_dose: float, margem_desejada_pct: float) -> float:
    if margem_desejada_pct <= 0 or margem_desejada_pct >= 100:
        return 0.0
    return round(custo_dose / (1 - margem_desejada_pct / 100), 2)


def calcular_cmv_pct(custo_dose: float, preco_venda: float) -> float:
    if preco_venda <= 0:
        return 0.0
    return round((custo_dose / preco_venda) * 100, 2)


@router.get("/")
def listar_precificacao(
    categoria: Optional[str] = Query(default=None),
    cmv_min: Optional[float] = Query(default=None),
    cmv_max: Optional[float] = Query(default=None),
    apenas_sem_preco: bool = Query(default=False),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Produto).filter(Produto.ativo == True)

    if categoria:
        query = query.filter(Produto.categoria == categoria)

    produtos = query.order_by(Produto.categoria, Produto.nome).all()
    resultados = []

    for produto in produtos:
        custo_dose = calcular_custo_dose(db, produto.id)
        preco_venda = produto.preco_venda or 0
        cmv_atual = calcular_cmv_pct(custo_dose, preco_venda)

        if apenas_sem_preco and produto.preco_sugerido is not None:
            continue

        resultado = {
            "produto_id": produto.id,
            "nome": produto.nome,
            "categoria": produto.categoria,
            "preco_venda": preco_venda,
            "custo_dose": custo_dose,
            "cmv_atual": cmv_atual,
            "margem_atual": round(100 - cmv_atual, 2) if cmv_atual > 0 else 0,
            "preco_sugerido_25": calcular_preco_sugerido(custo_dose, 25),
            "preco_sugerido_30": calcular_preco_sugerido(custo_dose, 30),
            "preco_sugerido_35": calcular_preco_sugerido(custo_dose, 35),
            "preco_sugerido_40": calcular_preco_sugerido(custo_dose, 40),
            "preco_sugerido_atual": produto.preco_sugerido,
            "cmv_25": calcular_cmv_pct(custo_dose, calcular_preco_sugerido(custo_dose, 25)),
            "cmv_30": calcular_cmv_pct(custo_dose, calcular_preco_sugerido(custo_dose, 30)),
            "cmv_35": calcular_cmv_pct(custo_dose, calcular_preco_sugerido(custo_dose, 35)),
            "cmv_40": calcular_cmv_pct(custo_dose, calcular_preco_sugerido(custo_dose, 40)),
            "possui_receita": custo_dose > 0,
        }
        resultados.append(resultado)

    if cmv_min is not None:
        resultados = [r for r in resultados if r["cmv_atual"] >= cmv_min]
    if cmv_max is not None:
        resultados = [r for r in resultados if r["cmv_atual"] <= cmv_max]

    return {"total": len(resultados), "produtos": resultados[offset:offset + limit]}


@router.get("/{produto_id}")
def obter_precificacao(
    produto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    custo_dose = calcular_custo_dose(db, produto.id)
    preco_venda = produto.preco_venda or 0
    cmv_atual = calcular_cmv_pct(custo_dose, preco_venda)

    receitas = db.query(Receita).filter(Receita.produto_id == produto_id).all()
    ingredientes = []
    for r in receitas:
        insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
        if insumo:
            ingredientes.append({
                "insumo_id": insumo.id,
                "nome": insumo.nome,
                "quantidade": r.quantidade_necessaria,
                "unidade_medida": insumo.unidade_medida,
                "custo_unitario": insumo.custo_unitario or 0,
                "custo_parcial": round((insumo.custo_unitario or 0) * r.quantidade_necessaria, 4),
                "percentual_custo": round(
                    ((insumo.custo_unitario or 0) * r.quantidade_necessaria) / custo_dose * 100, 2
                ) if custo_dose > 0 else 0,
            })

    targets = [25, 30, 35, 40]
    cenario = []
    for margem in targets:
        sugerido = calcular_preco_sugerido(custo_dose, margem)
        cenario.append({
            "margem_desejada": margem,
            "preco_sugerido": sugerido,
            "cmv_resultante": calcular_cmv_pct(custo_dose, sugerido),
            "lucro_por_dose": round(sugerido - custo_dose, 2),
            "diferenca_preco_atual": round(sugerido - preco_venda, 2),
        })

    return {
        "produto_id": produto.id,
        "nome": produto.nome,
        "categoria": produto.categoria,
        "preco_venda": preco_venda,
        "custo_dose": custo_dose,
        "cmv_atual": cmv_atual,
        "margem_atual": round(100 - cmv_atual, 2) if cmv_atual > 0 else 0,
        "preco_sugerido_atual": produto.preco_sugerido,
        "ingredientes": ingredientes,
        "cenarios": cenario,
    }


@router.put("/{produto_id}/aplicar")
def aplicar_preco_sugerido(
    produto_id: int,
    target_cmv: float = Query(30, ge=10, le=60),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    custo_dose = calcular_custo_dose(db, produto.id)
    if custo_dose <= 0:
        raise HTTPException(status_code=400, detail="Produto sem receita ou custo zero")

    margem_desejada = 100 - target_cmv
    novo_preco = calcular_preco_sugerido(custo_dose, margem_desejada)

    if novo_preco <= 0:
        raise HTTPException(status_code=400, detail="Cálculo de preço inválido")

    preco_anterior = produto.preco_venda
    produto.preco_venda = novo_preco
    produto.preco_sugerido = novo_preco
    db.commit()
    db.refresh(produto)

    logger.info(f"[Precificacao] Preço aplicado: {produto.nome} R${preco_anterior:.2f} → R${novo_preco:.2f} (CMV alvo: {target_cmv}%)")

    return {
        "mensagem": f"Preço atualizado de R${preco_anterior:.2f} para R${novo_preco:.2f}",
        "produto_id": produto.id,
        "nome": produto.nome,
        "preco_anterior": preco_anterior,
        "preco_novo": novo_preco,
        "cmv_alvo": target_cmv,
        "cmv_resultante": calcular_cmv_pct(custo_dose, novo_preco),
    }


@router.get("/categorias/lista")
def listar_categorias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    categorias = db.query(Produto.categoria).filter(
        Produto.ativo == True,
        Produto.categoria.isnot(None)
    ).distinct().all()
    return [c[0] for c in categorias if c[0]]
