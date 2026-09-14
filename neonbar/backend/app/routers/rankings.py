"""
BARIZE - Rankings e Analytics Avançados
Endpoints consolidados para rankings de produtos por diversas métricas.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime, timedelta, timezone

from ..database import get_db
from ..models.usuario import Usuario
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/rankings", tags=["Rankings e Analytics"])


def _periodo(data_inicio: Optional[date], data_fim: Optional[date], dias: int):
    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim - timedelta(days=dias)
    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())
    return data_inicio, data_fim, inicio_dt, fim_dt


def _base_query():
    return """
        SELECT
            p.id,
            p.nome,
            COALESCE(p.categoria, 'Sem categoria') AS categoria,
            p.preco_venda,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN m.quantidade_produto END), 0) AS quantidade,
            COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN p.preco_venda * m.quantidade_produto END), 0) AS receita,
            COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) AS custo
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
          AND m.produto_id IS NOT NULL
          AND m.data >= :di AND m.data <= :df
    """


@router.get("/mais-vendidos")
def ranking_mais_vendidos(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Top produtos mais vendidos por quantidade no período."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += " GROUP BY p.id, p.nome, p.categoria, p.preco_venda ORDER BY quantidade DESC LIMIT :limite"

        params = {"di": di, "df": df, "limite": limite}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "valor": round(r.quantidade, 2),
                    "receita": round(r.receita, 2),
                    "custo": round(r.custo, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/maior-cmv")
def ranking_maior_cmv(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Top produtos com maior custo (CMV absoluto) no período."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += " GROUP BY p.id, p.nome, p.categoria, p.preco_venda HAVING custo > 0 ORDER BY custo DESC LIMIT :limite"

        params = {"di": di, "df": df, "limite": limite}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "valor": round(r.custo, 2),
                    "quantidade": round(r.quantidade, 2),
                    "receita": round(r.receita, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/melhor-cmv")
def ranking_melhor_cmv(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Top produtos com menor CMV% (melhor custo relativo) no período."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += """
            GROUP BY p.id, p.nome, p.categoria, p.preco_venda
            HAVING receita > 0
            ORDER BY (custo / receita) ASC
            LIMIT :limite
        """

        params = {"di": di, "df": df, "limite": limite}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "valor": round((r.custo / r.receita) * 100, 2),
                    "custo": round(r.custo, 2),
                    "receita": round(r.receita, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/maior-lucro")
def ranking_maior_lucro(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Top produtos com maior lucro bruto (receita - custo) no período."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += """
            GROUP BY p.id, p.nome, p.categoria, p.preco_venda
            ORDER BY (receita - custo) DESC
            LIMIT :limite
        """

        params = {"di": di, "df": df, "limite": limite}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "valor": round(r.receita - r.custo, 2),
                    "receita": round(r.receita, 2),
                    "custo": round(r.custo, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/prejuizos")
def ranking_prejuizos(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Produtos onde CMV > preço de venda (prejuízo)."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += """
            GROUP BY p.id, p.nome, p.categoria, p.preco_venda
            HAVING custo > receita AND quantidade > 0
            ORDER BY (custo - receita) DESC
        """

        params = {"di": di, "df": df}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "total_prejuizo": round(sum(r.custo - r.receita for r in rows), 2),
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "prejuizo": round(r.custo - r.receita, 2),
                    "custo": round(r.custo, 2),
                    "receita": round(r.receita, 2),
                    "quantidade": round(r.quantidade, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/maior-receita")
def ranking_maior_receita(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Top produtos por receita total no período."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += " GROUP BY p.id, p.nome, p.categoria, p.preco_venda HAVING receita > 0 ORDER BY receita DESC LIMIT :limite"

        params = {"di": di, "df": df, "limite": limite}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "valor": round(r.receita, 2),
                    "custo": round(r.custo, 2),
                    "quantidade": round(r.quantidade, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/melhor-margem")
def ranking_melhor_margem(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    categoria: Optional[str] = None,
    limite: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Top produtos com melhor margem bruta (%) no período."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = _base_query()
        if categoria:
            sql += " AND COALESCE(p.categoria, 'Sem categoria') = :categoria"
        sql += """
            GROUP BY p.id, p.nome, p.categoria, p.preco_venda
            HAVING receita > 0
            ORDER BY ((receita - custo) / receita) DESC
            LIMIT :limite
        """

        params = {"di": di, "df": df, "limite": limite}
        if categoria:
            params["categoria"] = categoria

        rows = db.execute(text(sql), params).fetchall()

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categoria": categoria,
            "itens": [
                {
                    "rank": i + 1,
                    "produto_id": r.id,
                    "nome": r.nome,
                    "categoria": r.categoria,
                    "valor": round(((r.receita - r.custo) / r.receita) * 100, 2),
                    "receita": round(r.receita, 2),
                    "custo": round(r.custo, 2),
                }
                for i, r in enumerate(rows)
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")


@router.get("/por-categoria")
def ranking_por_categoria(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    dias: int = Query(30),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Ranking consolidado por categoria de produto."""
    verificar_role(current_user, ["admin", "gerente"])

    try:
        _, _, di, df = _periodo(data_inicio, data_fim, dias)

        sql = """
            SELECT
                COALESCE(p.categoria, 'Sem categoria') AS categoria,
                COUNT(DISTINCT p.id) AS total_produtos,
                COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN m.quantidade_produto END), 0) AS quantidade,
                COALESCE(SUM(CASE WHEN m.quantidade_produto IS NOT NULL THEN p.preco_venda * m.quantidade_produto END), 0) AS receita,
                COALESCE(SUM(ABS(m.quantidade) * m.custo_no_momento), 0) AS custo
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
            margem = r.receita - r.custo
            margem_pct = (margem / r.receita * 100) if r.receita > 0 else 0
            cmv_pct = (r.custo / r.receita * 100) if r.receita > 0 else 0
            categorias.append({
                "categoria": r.categoria,
                "total_produtos": int(r.total_produtos),
                "quantidade": round(r.quantidade, 2),
                "receita": round(r.receita, 2),
                "custo": round(r.custo, 2),
                "margem": round(margem, 2),
                "margem_pct": round(margem_pct, 2),
                "cmv_pct": round(cmv_pct, 2),
            })

        return {
            "data_inicio": data_inicio.isoformat() if data_inicio else None,
            "data_fim": data_fim.isoformat() if data_fim else None,
            "periodo_dias": dias,
            "categorias": categorias,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular ranking: {str(e)}")
