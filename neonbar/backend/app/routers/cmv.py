"""
BARIZE - Rotas de CMV e Relatórios Financeiros
Pilar 6: Operacional - Relatório de CMV
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, date, timezone

from ..database import get_db
from ..models.usuario import Usuario
from ..services.auth_service import get_current_user, verificar_role
from ..services.estoque_service import EstoqueService

router = APIRouter(prefix="/cmv", tags=["CMV - Custos"])


@router.get("/calcular")
def calcular_cmv(
    dias: int = Query(30, description="Período em dias para cálculo"),
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Calcula o Custo de Mercadoria Vendida (CMV).
    CMV = Custo total dos insumos vendidos / Receita total × 100
    Ideal: < 30% para bares com margem saudável.
    """
    verificar_role(current_user, ["admin", "gerente"])

    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=dias)

    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())

    resultado = EstoqueService.calcular_cmv(
        db=db,
        data_inicio=inicio_dt,
        data_fim=fim_dt,
    )

    resultado["periodo"] = {
        "data_inicio": data_inicio.isoformat(),
        "data_fim": data_fim.isoformat(),
        "dias": (data_fim - data_inicio).days,
    }

    # Interpretação do CMV
    cmv = resultado["cmv_percentual"]
    if cmv < 25:
        resultado["interpretacao"] = "Excelente! Margem saudável."
    elif cmv < 35:
        resultado["interpretacao"] = "Bom. Dentro do esperado para bares."
    elif cmv < 45:
        resultado["interpretacao"] = "Atenção. Revise preços ou reduza desperdícios."
    else:
        resultado["interpretacao"] = "Crítico. CMV muito alto, ação necessária."

    return resultado


@router.get("/dashboard")
def dashboard_financeiro(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Dashboard financeiro rápido:
    - CMV do mês atual
    - Receita do dia
    - Total de vendas do mês
    """
    verificar_role(current_user, ["admin", "gerente"])

    hoje = datetime.now(timezone.utc).date()
    inicio_mes = date(hoje.year, hoje.month, 1)
    inicio_mes_dt = datetime.combine(inicio_mes, datetime.min.time())
    hoje_inicio = datetime.combine(hoje, datetime.min.time())
    hoje_fim = datetime.combine(hoje, datetime.max.time())

    cmv_mes = EstoqueService.calcular_cmv(
        db=db,
        data_inicio=inicio_mes_dt,
        data_fim=hoje_fim,
    )

    from sqlalchemy import text
    # Usa data UTC e filtra no Python para evitar timezone mismatch
    sql_vendas_dia = text("""
        SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
        AND m.data >= :di AND m.data <= :df
        AND m.produto_id IS NOT NULL
        AND m.quantidade_produto IS NOT NULL
    """)
    receita_dia = db.execute(
        sql_vendas_dia,
        {"di": hoje_inicio, "df": hoje_fim},
    ).scalar() or 0.0

    return {
        "data": hoje.isoformat(),
        "receita_dia": round(receita_dia, 2),
        "cmv_mes": cmv_mes,
        "resumo": {
            "cmv_percentual": cmv_mes["cmv_percentual"],
            "receita_mes": cmv_mes["receita_total"],
            "custo_mes": cmv_mes["custo_total"],
        },
    }
