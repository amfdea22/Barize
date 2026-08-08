from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
from datetime import datetime, timedelta, date, timezone
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.produto import Produto
from ..models.movimentacao import Movimentacao
from ..models.custo_fixo import CustoFixo
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/financeiro-plus", tags=["Financeiro Plus"])


@router.get("/vendas-por-categoria")
def vendas_por_categoria(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=30)

    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())

    sql = text("""
        SELECT
            p.categoria,
            COUNT(DISTINCT m.id) as total_vendas,
            SUM(p.preco_venda * m.quantidade_produto) as receita,
            SUM(m.quantidade_produto) as quantidade_total
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
            AND m.data >= :di
            AND m.data <= :df
        GROUP BY p.categoria
        ORDER BY receita DESC
    """)

    rows = db.execute(sql, {"di": inicio_dt, "df": fim_dt}).fetchall()
    total_receita = sum(r.receita or 0 for r in rows) or 1

    categorias = [
        {
            "categoria": r.categoria or "Sem categoria",
            "total_vendas": r.total_vendas,
            "quantidade_total": round(r.quantidade_total or 0, 2),
            "receita": round(r.receita or 0, 2),
            "percentual": round((r.receita or 0) / total_receita * 100, 1),
        }
        for r in rows
    ]

    return {
        "periodo": {
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
        },
        "total_receita": round(total_receita, 2),
        "categorias": categorias,
    }


@router.get("/dre")
def dre(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    aliquota_impostos: float = Query(8.0, ge=0, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        primeiro_dia = date(data_fim.year, data_fim.month, 1)
        data_inicio = primeiro_dia

    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())

    sql_receita = text("""
        SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
            AND m.data >= :di
            AND m.data <= :df
    """)
    receita_bruta = db.execute(sql_receita, {"di": inicio_dt, "df": fim_dt}).scalar() or 0.0

    sql_cmv = text("""
        SELECT COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0)
        FROM movimentacoes m
        WHERE m.tipo = 'VENDA'
            AND m.data >= :di
            AND m.data <= :df
    """)
    cmv_total = db.execute(sql_cmv, {"di": inicio_dt, "df": fim_dt}).scalar() or 0.0

    custos_fixos = db.query(func.sum(CustoFixo.valor)).filter(
        CustoFixo.ativo == 1
    ).scalar() or 0.0

    receita_liquida = receita_bruta * (1 - aliquota_impostos / 100)
    lucro_operacional = receita_liquida - cmv_total - custos_fixos
    margem_liquida = (lucro_operacional / receita_bruta * 100) if receita_bruta > 0 else 0

    return {
        "periodo": {
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
        },
        "receita_bruta": round(receita_bruta, 2),
        "deducoes_impostos": round(receita_bruta * aliquota_impostos / 100, 2),
        "aliquota_impostos_pct": aliquota_impostos,
        "receita_liquida": round(receita_liquida, 2),
        "cmv": round(abs(cmv_total), 2),
        "custos_fixos": round(custos_fixos, 2),
        "lucro_operacional": round(lucro_operacional, 2),
        "margem_liquida": round(margem_liquida, 2),
    }


@router.get("/custos-fixos")
def listar_custos_fixos(
    ativos: Optional[bool] = Query(default=True),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(CustoFixo)
    if ativos:
        query = query.filter(CustoFixo.ativo == 1)
    custos = query.order_by(CustoFixo.categoria, CustoFixo.nome).all()

    total = sum(c.valor for c in custos)
    return {
        "total_mensal": round(total, 2),
        "custos": [
            {
                "id": c.id,
                "nome": c.nome,
                "categoria": c.categoria,
                "valor": c.valor,
                "dia_vencimento": c.dia_vencimento,
                "observacao": c.observacao,
                "ativo": bool(c.ativo),
            }
            for c in custos
        ],
    }


@router.post("/custos-fixos")
def criar_custo_fixo(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    custo = CustoFixo(
        nome=data["nome"],
        categoria=data.get("categoria"),
        valor=data["valor"],
        dia_vencimento=data.get("dia_vencimento"),
        observacao=data.get("observacao"),
    )
    db.add(custo)
    db.commit()
    db.refresh(custo)
    logger.info(f"[CustosFixos] Criado: {custo.nome} R${custo.valor:.2f}")
    return {"mensagem": "Custo fixo criado com sucesso", "id": custo.id}


@router.put("/custos-fixos/{custo_id}")
def atualizar_custo_fixo(
    custo_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    c = db.query(CustoFixo).filter(CustoFixo.id == custo_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Custo fixo não encontrado")
    for campo in ["nome", "categoria", "valor", "dia_vencimento", "observacao", "ativo"]:
        if campo in data:
            setattr(c, campo, data[campo])
    db.commit()
    return {"mensagem": "Custo fixo atualizado com sucesso"}


@router.delete("/custos-fixos/{custo_id}")
def excluir_custo_fixo(
    custo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    c = db.query(CustoFixo).filter(CustoFixo.id == custo_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Custo fixo não encontrado")
    c.ativo = 0
    db.commit()
    return {"mensagem": "Custo fixo desativado com sucesso"}


@router.get("/metas")
def listar_metas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoje = datetime.now(timezone.utc).date()
    inicio_mes = date(hoje.year, hoje.month, 1)
    fim_mes = date(hoje.year, hoje.month + 1, 1) - timedelta(days=1) if hoje.month < 12 else date(hoje.year, 12, 31)

    inicio_dt = datetime.combine(inicio_mes, datetime.min.time())
    fim_dt = datetime.combine(fim_mes, datetime.max.time())

    sql_receita = text("""
        SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
            AND m.quantidade_produto IS NOT NULL
            AND m.data >= :di AND m.data <= :df
    """)
    receita_real = db.execute(sql_receita, {"di": inicio_dt, "df": fim_dt}).scalar() or 0.0

    sql_cmv = text("""
        SELECT COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0)
        FROM movimentacoes m
        WHERE m.tipo = 'VENDA' AND m.data >= :di AND m.data <= :df
    """)
    cmv_real = db.execute(sql_cmv, {"di": inicio_dt, "df": fim_dt}).scalar() or 0.0
    cmv_pct = round((cmv_real / receita_real * 100), 1) if receita_real > 0 else 0

    total_transacoes = db.query(func.count(func.distinct(Movimentacao.id))).filter(
        Movimentacao.tipo == "VENDA",
        Movimentacao.data >= inicio_dt,
        Movimentacao.data <= fim_dt,
        Movimentacao.quantidade_produto.isnot(None),
    ).scalar() or 0
    ticket_medio = round(receita_real / total_transacoes, 2) if total_transacoes > 0 else 0

    return {
        "mes": inicio_mes.isoformat(),
        "metas_padrao": {
            "receita": {"meta": 0, "realizado": round(receita_real, 2)},
            "cmv": {"meta": 30, "realizado": cmv_pct},
            "lucro": {"meta": 0, "realizado": round(receita_real - cmv_real, 2)},
            "ticket_medio": {"meta": 0, "realizado": ticket_medio},
        },
    }
