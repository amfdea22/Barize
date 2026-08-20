from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional
from datetime import datetime, timedelta, date, timezone
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.insumo import Insumo
from ..models.movimentacao import Movimentacao
from ..models.lote import Lote
from ..models.fornecedor import Fornecedor
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/analise-estoque", tags=["Análise de Estoque"])


@router.get("/giro")
def calcular_giro_estoque(
    dias: int = Query(30, ge=1, le=365),
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=dias)

    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())
    periodo_dias = (data_fim - data_inicio).days or 1

    custo_vendas = db.query(
        func.sum(Movimentacao.quantidade * Movimentacao.custo_no_momento)
    ).filter(
        Movimentacao.tipo == "VENDA",
        Movimentacao.data >= inicio_dt,
        Movimentacao.data <= fim_dt,
    ).scalar() or 0.0
    custo_vendas = abs(custo_vendas)

    total_insumos = db.query(func.count(Insumo.id)).filter(Insumo.ativo == 1).scalar() or 0

    sql_estoque_medio = text("""
        SELECT COALESCE(AVG(estoque_atual * custo_unitario), 0)
        FROM insumos WHERE ativo = 1
    """)
    estoque_medio = db.execute(sql_estoque_medio).scalar() or 1.0

    giro = round(custo_vendas / estoque_medio, 2) if estoque_medio > 0 else 0
    dias_cobertura = round(periodo_dias / giro, 1) if giro > 0 else 999

    return {
        "periodo": {
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
            "dias": periodo_dias,
        },
        "custo_vendas_periodo": round(custo_vendas, 2),
        "estoque_medio_valor": round(estoque_medio, 2),
        "giro_estoque": giro,
        "dias_cobertura": dias_cobertura,
        "total_insumos_ativos": total_insumos,
        "interpretacao": (
            "Excelente rotatividade" if giro >= 4
            else "Boa rotatividade" if giro >= 2
            else "Rotatividade baixa" if giro >= 1
            else "Crítico - estoque parado"
        ),
    }


@router.get("/abc")
def curva_abc(
    dias: int = Query(90, ge=1, le=365),
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=dias)

    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())

    sql = text("""
        SELECT
            i.id,
            i.nome,
            i.categoria,
            i.custo_unitario,
            i.estoque_atual,
            COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) as valor_consumo,
            COALESCE(SUM(ABS(m.quantidade)), 0) as quantidade_consumida
        FROM insumos i
        LEFT JOIN movimentacoes m ON m.insumo_id = i.id
            AND m.tipo = 'VENDA'
            AND m.data >= :di
            AND m.data <= :df
        WHERE i.ativo = 1
        GROUP BY i.id, i.nome, i.categoria, i.custo_unitario, i.estoque_atual
        HAVING valor_consumo > 0
        ORDER BY valor_consumo DESC
    """)

    rows = db.execute(sql, {"di": inicio_dt, "df": fim_dt}).fetchall()

    total_valor = sum(r.valor_consumo for r in rows) or 1
    acumulado = 0.0
    resultados = []

    for r in rows:
        pct = round(r.valor_consumo / total_valor * 100, 2)
        acumulado += pct
        if acumulado <= 80:
            classificacao = "A"
        elif acumulado <= 95:
            classificacao = "B"
        else:
            classificacao = "C"

        resultados.append({
            "insumo_id": r.id,
            "nome": r.nome,
            "categoria": r.categoria,
            "custo_unitario": round(r.custo_unitario, 4),
            "estoque_atual": r.estoque_atual,
            "valor_consumo": round(r.valor_consumo, 2),
            "quantidade_consumida": round(r.quantidade_consumida, 2),
            "percentual": pct,
            "percentual_acumulado": round(acumulado, 2),
            "classificacao": classificacao,
        })

    totais = {
        "A": sum(r["valor_consumo"] for r in resultados if r["classificacao"] == "A"),
        "B": sum(r["valor_consumo"] for r in resultados if r["classificacao"] == "B"),
        "C": sum(r["valor_consumo"] for r in resultados if r["classificacao"] == "C"),
    }

    return {
        "periodo": {
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
        },
        "total_valor_consumo": round(total_valor, 2),
        "itens": resultados,
        "resumo": {
            "A": {"valor": round(totais["A"], 2), "percentual": round(totais["A"] / total_valor * 100, 1), "itens": sum(1 for r in resultados if r["classificacao"] == "A")},
            "B": {"valor": round(totais["B"], 2), "percentual": round(totais["B"] / total_valor * 100, 1), "itens": sum(1 for r in resultados if r["classificacao"] == "B")},
            "C": {"valor": round(totais["C"], 2), "percentual": round(totais["C"] / total_valor * 100, 1), "itens": sum(1 for r in resultados if r["classificacao"] == "C")},
        },
    }


@router.get("/ponto-pedido")
def calcular_ponto_pedido(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    hoje = datetime.now(timezone.utc).date()
    inicio_30d = datetime.combine(hoje - timedelta(days=30), datetime.min.time())
    fim_dt = datetime.combine(hoje, datetime.max.time())

    sql = text("""
        SELECT
            i.id,
            i.nome,
            i.categoria,
            i.unidade_medida,
            i.estoque_atual,
            i.estoque_minimo,
            i.custo_unitario,
            COALESCE(SUM(ABS(m.quantidade)), 0) as consumo_30d
        FROM insumos i
        LEFT JOIN movimentacoes m ON m.insumo_id = i.id
            AND m.tipo = 'VENDA'
            AND m.data >= :di
            AND m.data <= :df
        WHERE i.ativo = 1
        GROUP BY i.id, i.nome, i.categoria, i.unidade_medida, i.estoque_atual, i.estoque_minimo, i.custo_unitario
        ORDER BY i.nome
    """)

    rows = db.execute(sql, {"di": inicio_30d, "df": fim_dt}).fetchall()

    lead_time_medio = db.query(func.avg(Fornecedor.prazo_entrega_dias)).filter(
        Fornecedor.ativo == 1, Fornecedor.prazo_entrega_dias.isnot(None)
    ).scalar() or 7.0
    LEAD_TIME_DIAS = round(lead_time_medio)
    DIAS_ANALISE = 30
    FATOR_SEGURANCA = 1.5

    resultados = []
    for r in rows:
        consumo_diario = r.consumo_30d / DIAS_ANALISE if r.consumo_30d > 0 else 0
        ponto_pedido = round(consumo_diario * LEAD_TIME_DIAS * FATOR_SEGURANCA, 2)
        estoque_seguranca = round(consumo_diario * FATOR_SEGURANCA, 2)
        quantidade_repor = max(0, round(ponto_pedido - r.estoque_atual, 2))
        dias_restantes = round(r.estoque_atual / consumo_diario, 1) if consumo_diario > 0 else 999

        resultados.append({
            "insumo_id": r.id,
            "nome": r.nome,
            "categoria": r.categoria,
            "unidade_medida": r.unidade_medida,
            "estoque_atual": r.estoque_atual,
            "estoque_minimo": r.estoque_minimo or 0,
            "consumo_diario_medio": round(consumo_diario, 4),
            "consumo_30d": round(r.consumo_30d or 0, 2),
            "lead_time_dias": LEAD_TIME_DIAS,
            "estoque_seguranca": estoque_seguranca,
            "ponto_pedido": ponto_pedido,
            "quantidade_repor": quantidade_repor,
            "dias_ate_zerar": dias_restantes,
            "status": (
                "urgente" if r.estoque_atual <= estoque_seguranca
                else "repor_em_breve" if r.estoque_atual <= ponto_pedido
                else "ok"
            ),
        })

    return {
        "data_referencia": hoje.isoformat(),
        "lead_time_padrao_dias": LEAD_TIME_DIAS,
        "itens": resultados,
        "resumo": {
            "total": len(resultados),
            "urgentes": sum(1 for r in resultados if r["status"] == "urgente"),
            "repor_em_breve": sum(1 for r in resultados if r["status"] == "repor_em_breve"),
            "ok": sum(1 for r in resultados if r["status"] == "ok"),
        },
    }
