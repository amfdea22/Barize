"""
BARIZE - Relatórios precisos de CMV, margem de lucro e insumos.

Dados corretos vêm de `movimentacoes`:
- custo: SUM(|quantidade| * custo_no_momento) das movs VENDA (snapshot do custo na venda)
- receita: SUM(preco_venda * quantidade_produto) — quantidade_produto é preenchida
  apenas na PRIMEIRA movimentação de cada venda (1 registro por produto vendido),
  evitando inflar receita em produtos compostos (2+ insumos).
"""

import csv
import io
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.usuario import Usuario
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/cmv/relatorios", tags=["CMV - Relatórios precisos"])


def _periodo(data_inicio: Optional[date], data_fim: Optional[date], dias: int):
    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=dias)
    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())
    return data_inicio, data_fim, inicio_dt, fim_dt


# ─── CMV / Margem por produto ────────────────────────────────────────────────
@router.get("/produtos")
def cmv_por_produto(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    order_by: str = Query("receita", description="receita|custo|margem|cmv|nome"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    CMV e margem por produto no período: receita, custo, margem bruta (R$ e %),
    quantidade vendida e CMV%. Ordenável.
    """
    _, _, di, df = _periodo(data_inicio, data_fim, dias)

    sql = """
        SELECT
            p.id,
            p.nome,
            p.categoria,
            p.preco_venda,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN m.quantidade_produto END), 0) AS quantidade,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN p.preco_venda * m.quantidade_produto END), 0) AS receita,
            COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) AS custo
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
          AND m.produto_id IS NOT NULL
          AND m.data >= :di AND m.data <= :df
        GROUP BY p.id, p.nome, p.categoria, p.preco_venda
    """
    ordenacoes = {
        "receita": "receita DESC",
        "custo": "custo DESC",
        "margem": "margem_bruta DESC",
        "cmv": "cmv_pct DESC",
        "nome": "p.nome ASC",
    }
    order = ordenacoes.get(order_by, "receita DESC")

    rows = db.execute(
        text(sql + f" ORDER BY {order}"), {"di": di, "df": df}
    ).fetchall()

    itens = []
    for r in rows:
        margem_bruta = r.receita - r.custo
        cmv_pct = (r.custo / r.receita * 100) if r.receita > 0 else 0
        margem_pct = (margem_bruta / r.receita * 100) if r.receita > 0 else 0
        itens.append({
            "produto_id": r.id,
            "nome": r.nome,
            "categoria": r.categoria,
            "preco_venda": round(r.preco_venda, 2),
            "quantidade_vendida": round(r.quantidade, 2),
            "receita": round(r.receita, 2),
            "custo": round(r.custo, 2),
            "margem_bruta": round(margem_bruta, 2),
            "margem_pct": round(margem_pct, 2),
            "cmv_pct": round(cmv_pct, 2),
        })

    data_inicio_final, data_fim_final, _, _ = _periodo(data_inicio, data_fim, dias)
    return {
        "data_inicio": data_inicio_final.isoformat(),
        "data_fim": data_fim_final.isoformat(),
        "total_receita": round(sum(i["receita"] for i in itens), 2),
        "total_custo": round(sum(i["custo"] for i in itens), 2),
        "total_margem": round(sum(i["margem_bruta"] for i in itens), 2),
        "produtos": itens,
    }


# ─── CMV por categoria ───────────────────────────────────────────────────────
@router.get("/categorias")
def cmv_por_categoria(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """CMV e margem agregados por categoria de produto no período."""
    _, _, di, df = _periodo(data_inicio, data_fim, dias)

    sql = """
        SELECT
            COALESCE(p.categoria, 'Sem categoria') AS categoria,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN p.preco_venda * m.quantidade_produto END), 0) AS receita,
            COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) AS custo,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN m.quantidade_produto END), 0) AS quantidade
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
          AND m.produto_id IS NOT NULL
          AND m.data >= :di AND m.data <= :df
        GROUP BY COALESCE(p.categoria, 'Sem categoria')
        ORDER BY receita DESC
    """
    rows = db.execute(text(sql), {"di": di, "df": df}).fetchall()

    categorias = []
    for r in rows:
        margem_bruta = r.receita - r.custo
        cmv_pct = (r.custo / r.receita * 100) if r.receita > 0 else 0
        categorias.append({
            "categoria": r.categoria,
            "receita": round(r.receita, 2),
            "custo": round(r.custo, 2),
            "quantidade_vendida": round(r.quantidade, 2),
            "margem_bruta": round(margem_bruta, 2),
            "cmv_pct": round(cmv_pct, 2),
        })

    data_inicio_final, data_fim_final, _, _ = _periodo(data_inicio, data_fim, dias)
    return {
        "data_inicio": data_inicio_final.isoformat(),
        "data_fim": data_fim_final.isoformat(),
        "categorias": categorias,
    }


# ─── Consumo / custo de insumos no período ───────────────────────────────────
@router.get("/insumos")
def consumo_insumos(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Consumo de insumos no período: quantidade consumida e custo consumido (somente VENDA)."""
    _, _, di, df = _periodo(data_inicio, data_fim, dias)

    sql = """
        SELECT
            i.id,
            i.nome,
            i.categoria,
            i.unidade_medida,
            COALESCE(SUM(ABS(m.quantidade)), 0) AS quantidade,
            COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) AS custo
        FROM movimentacoes m
        JOIN insumos i ON i.id = m.insumo_id
        WHERE m.tipo = 'VENDA'
          AND m.data >= :di AND m.data <= :df
        GROUP BY i.id, i.nome, i.categoria, i.unidade_medida
        ORDER BY custo DESC
    """
    rows = db.execute(text(sql), {"di": di, "df": df}).fetchall()

    data_inicio_final, data_fim_final, _, _ = _periodo(data_inicio, data_fim, dias)
    return {
        "data_inicio": data_inicio_final.isoformat(),
        "data_fim": data_fim_final.isoformat(),
        "total_custo": round(sum(r.custo for r in rows), 2),
        "insumos": [
            {
                "insumo_id": r.id,
                "nome": r.nome,
                "categoria": r.categoria,
                "unidade_medida": r.unidade_medida,
                "quantidade_consumida": round(r.quantidade, 2),
                "custo_consumido": round(r.custo, 2),
            }
            for r in rows
        ],
    }


# ─── Produtos que consomem um insumo ─────────────────────────────────────────
@router.get("/insumos/{insumo_id}/produtos")
def produtos_por_insumo(
    insumo_id: int,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Quais produtos consomem o insumo X no período (quantidade e custo)."""
    _, _, di, df = _periodo(data_inicio, data_fim, dias)

    sql = """
        SELECT
            p.id,
            p.nome,
            p.categoria,
            p.preco_venda,
            COALESCE(SUM(ABS(m.quantidade)), 0) AS quantidade_insumo,
            COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) AS custo,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN m.quantidade_produto END), 0) AS quantidade_produto,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN p.preco_venda * m.quantidade_produto END), 0) AS receita
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
          AND m.insumo_id = :insumo_id
          AND m.produto_id IS NOT NULL
          AND m.data >= :di AND m.data <= :df
        GROUP BY p.id, p.nome, p.categoria, p.preco_venda
        ORDER BY quantidade_insumo DESC
    """
    rows = db.execute(
        text(sql), {"insumo_id": insumo_id, "di": di, "df": df}
    ).fetchall()

    data_inicio_final, data_fim_final, _, _ = _periodo(data_inicio, data_fim, dias)
    return {
        "insumo_id": insumo_id,
        "data_inicio": data_inicio_final.isoformat(),
        "data_fim": data_fim_final.isoformat(),
        "produtos": [
            {
                "produto_id": r.id,
                "nome": r.nome,
                "categoria": r.categoria,
                "quantidade_insumo": round(r.quantidade_insumo, 2),
                "custo_insumo": round(r.custo, 2),
                "quantidade_produto": round(r.quantidade_produto, 2),
                "receita": round(r.receita, 2),
            }
            for r in rows
        ],
    }


# ─── Exportação CSV ──────────────────────────────────────────────────────────
def _csv_response(filename: str, header: list, rows: list[list]):
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter=";")
    writer.writerow(header)
    for r in rows:
        writer.writerow(r)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/produtos.csv")
def export_produtos_csv(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    payload = cmv_por_produto(data_inicio, data_fim, dias, db=db, current_user=current_user)
    header = ["Produto", "Categoria", "Preco Venda", "Qtd Vendida", "Receita", "Custo", "Margem Bruta", "Margem %", "CMV %"]
    rows = [
        [i["nome"], i["categoria"], i["preco_venda"], i["quantidade_vendida"],
         i["receita"], i["custo"], i["margem_bruta"], i["margem_pct"], i["cmv_pct"]]
        for i in payload["produtos"]
    ]
    return _csv_response("cmv_produtos.csv", header, rows)


@router.get("/categorias.csv")
def export_categorias_csv(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    payload = cmv_por_categoria(data_inicio, data_fim, dias, db=db, current_user=current_user)
    header = ["Categoria", "Receita", "Custo", "Qtd Vendida", "Margem Bruta", "CMV %"]
    rows = [
        [i["categoria"], i["receita"], i["custo"], i["quantidade_vendida"], i["margem_bruta"], i["cmv_pct"]]
        for i in payload["categorias"]
    ]
    return _csv_response("cmv_categorias.csv", header, rows)


@router.get("/insumos.csv")
def export_insumos_csv(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    payload = consumo_insumos(data_inicio, data_fim, dias, db=db, current_user=current_user)
    header = ["Insumo", "Categoria", "Unidade", "Qtd Consumida", "Custo Consumido"]
    rows = [
        [i["nome"], i["categoria"], i["unidade_medida"], i["quantidade_consumida"], i["custo_consumido"]]
        for i in payload["insumos"]
    ]
    return _csv_response("consumo_insumos.csv", header, rows)
