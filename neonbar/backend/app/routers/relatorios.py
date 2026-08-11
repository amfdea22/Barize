"""
BARIZE - Rotas de Relatórios e Auditoria
Pilar 5: Segurança e Auditoria - Logs de Auditoria
Pilar 6: Operacional - Relatórios
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, date, timedelta
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.audit import AuditLogResponse
from ..services.auth_service import get_current_user, verificar_role
from ..services.audit_service import AuditService
from ..services.estoque_service import EstoqueService
from ..models.alerta import AlertaConfig, AlertaDisparado
from ..schemas.alerta import AlertaConfigCreate, AlertaConfigResponse

router = APIRouter(prefix="/relatorios", tags=["Relatórios e Auditoria"])


# ─── Analytics ─────────────────────────────────────────────

def _periodo_datas(periodo: str):
    """Converte período (dia/semana/mes/ano) em (inicio, fim)."""
    hoje = date.today()
    if periodo == "dia":
        inicio = datetime.combine(hoje, datetime.min.time())
    elif periodo == "semana":
        inicio = datetime.combine(hoje - timedelta(days=hoje.weekday()), datetime.min.time())
    elif periodo == "mes":
        inicio = datetime.combine(date(hoje.year, hoje.month, 1), datetime.min.time())
    elif periodo == "ano":
        inicio = datetime.combine(date(hoje.year, 1, 1), datetime.min.time())
    else:
        inicio = datetime.combine(hoje, datetime.min.time())
    fim = datetime.combine(hoje, datetime.max.time())
    return inicio, fim


@router.get("/analytics/resumo")
def analytics_resumo(
    periodo: str = Query("dia", pattern="^(dia|semana|mes|ano)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Resumo de KPIs de vendas no período."""
    from sqlalchemy import func, text
    from ..models.movimentacao import Movimentacao
    from ..models.pedido import Pedido

    inicio, fim = _periodo_datas(periodo)

    # Receita total do período
    sql_receita = text("""
        SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
        AND m.data BETWEEN :inicio AND :fim
        AND m.produto_id IS NOT NULL
        AND m.quantidade_produto IS NOT NULL
    """)
    receita = db.execute(sql_receita, {"inicio": inicio, "fim": fim}).scalar() or 0.0

    # Número de vendas (pedidos) no período — distinto por produto+data aproximada
    sql_vendas = text("""
        SELECT COUNT(DISTINCT m.documento_referencia)
        FROM movimentacoes m
        WHERE m.tipo = 'VENDA'
        AND m.data BETWEEN :inicio AND :fim
        AND m.documento_referencia IS NOT NULL
    """)
    total_pedidos = db.execute(sql_vendas, {"inicio": inicio, "fim": fim}).scalar() or 0

    # Fallback: se não há documento_referencia, conta vendas por id
    if not total_pedidos:
        total_pedidos = (
            db.query(func.count(func.distinct(Movimentacao.id)))
            .filter(
                Movimentacao.tipo == "VENDA",
                Movimentacao.data.between(inicio, fim),
                Movimentacao.produto_id.isnot(None),
            )
            .scalar() or 0
        )

    ticket_medio = round(receita / total_pedidos, 2) if total_pedidos > 0 else 0.0

    # Total de itens vendidos
    total_itens = (
        db.query(func.sum(Movimentacao.quantidade_produto))
        .filter(
            Movimentacao.tipo == "VENDA",
            Movimentacao.quantidade_produto.isnot(None),
            Movimentacao.data.between(inicio, fim),
        )
        .scalar() or 0
    )

    # Pedidos ativos (KDS) — proxy para mesas em atendimento
    pedidos_ativos = (
        db.query(Pedido)
        .filter(Pedido.status.in_(["Novo", "Preparando", "Pronto"]))
        .all()
    )
    mesas_ativas = len({p.mesa for p in pedidos_ativos if p.mesa})

    # Período anterior (para variação %)
    duracao = fim - inicio
    inicio_prev = inicio - duracao - timedelta(seconds=1)
    fim_prev = inicio - timedelta(seconds=1)
    sql_receita_prev = text("""
        SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
        AND m.data BETWEEN :inicio AND :fim
        AND m.produto_id IS NOT NULL
        AND m.quantidade_produto IS NOT NULL
    """)
    receita_prev = db.execute(
        sql_receita_prev, {"inicio": inicio_prev, "fim": fim_prev}
    ).scalar() or 0.0

    variacao = round(((receita - receita_prev) / receita_prev) * 100, 1) if receita_prev > 0 else 0.0

    return {
        "periodo": periodo,
        "receita": round(receita, 2),
        "total_pedidos": int(total_pedidos),
        "total_itens": int(total_itens),
        "ticket_medio": ticket_medio,
        "mesas_ativas": int(mesas_ativas),
        "pedidos_ativos": len(pedidos_ativos),
        "variacao_percentual": variacao,
        "periodo_anterior_receita": round(receita_prev, 2),
    }


@router.get("/analytics/receita-por-hora")
def analytics_receita_por_hora(
    periodo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Receita por hora (dia) ou por dia (semana/mes)."""
    from sqlalchemy import text
    from datetime import datetime as _dt

    hoje = date.today()
    fim = _dt.combine(hoje, _dt.max.time())

    if periodo == "dia":
        inicio = _dt.combine(hoje, _dt.min.time())
        sql = text("""
            SELECT CAST(strftime('%H', m.data) AS INTEGER) AS hora,
                   COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0) AS receita
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND m.data BETWEEN :inicio AND :fim
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
            GROUP BY hora
            ORDER BY hora
        """)
        rows = db.execute(sql, {"inicio": inicio, "fim": fim}).fetchall()
        resultado = []
        for r in rows:
            resultado.append({"rotulo": f"{int(r.hora):02d}:00", "receita": round(float(r.receita), 2)})
        return resultado

    if periodo == "semana":
        inicio = _dt.combine(hoje - timedelta(days=hoje.weekday()), _dt.min.time())
    else:
        inicio = _dt.combine(date(hoje.year, hoje.month, 1), _dt.min.time())

    sql = text("""
        SELECT DATE(m.data) AS dia,
               COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0) AS receita
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
        AND m.data BETWEEN :inicio AND :fim
        AND m.produto_id IS NOT NULL
        AND m.quantidade_produto IS NOT NULL
        GROUP BY dia
        ORDER BY dia
    """)
    rows = db.execute(sql, {"inicio": inicio, "fim": fim}).fetchall()
    resultado = []
    for r in rows:
        resultado.append({"rotulo": r.dia, "receita": round(float(r.receita), 2)})
    return resultado


@router.get("/analytics/top-produtos")
def analytics_top_produtos(
    periodo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    limite: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Produtos mais vendidos no período (por quantidade e receita)."""
    from sqlalchemy import text

    inicio, fim = _periodo_datas(periodo)
    sql = text("""
        SELECT p.nome,
               SUM(m.quantidade_produto) AS quantidade,
               COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0) AS receita
        FROM movimentacoes m
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
        AND m.data BETWEEN :inicio AND :fim
        AND m.produto_id IS NOT NULL
        AND m.quantidade_produto IS NOT NULL
        GROUP BY p.id, p.nome
        ORDER BY quantidade DESC
        LIMIT :limite
    """)
    rows = db.execute(sql, {"inicio": inicio, "fim": fim, "limite": limite}).fetchall()
    resultado = []
    for r in rows:
        resultado.append({
            "nome": r.nome,
            "quantidade": int(r.quantidade),
            "receita": round(float(r.receita), 2),
        })
    return resultado


@router.get("/analytics/desempenho-equipe")
def analytics_desempenho_equipe(
    periodo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Desempenho por usuário (vendas registradas no período)."""
    from sqlalchemy import text

    inicio, fim = _periodo_datas(periodo)
    sql = text("""
        SELECT u.id AS usuario_id,
               u.nome AS nome,
               u.role AS role,
               COUNT(DISTINCT m.id) AS vendas,
               COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0) AS volume,
               COALESCE(SUM(m.quantidade_produto), 0) AS itens
        FROM movimentacoes m
        JOIN usuarios u ON u.id = m.usuario_id
        JOIN produtos p ON p.id = m.produto_id
        WHERE m.tipo = 'VENDA'
        AND m.data BETWEEN :inicio AND :fim
        AND m.usuario_id IS NOT NULL
        AND m.produto_id IS NOT NULL
        AND m.quantidade_produto IS NOT NULL
        GROUP BY u.id, u.nome, u.role
        ORDER BY volume DESC
    """)
    rows = db.execute(sql, {"inicio": inicio, "fim": fim}).fetchall()
    resultado = []
    for r in rows:
        ticket = round(float(r.volume) / int(r.vendas), 2) if r.vendas > 0 else 0.0
        resultado.append({
            "usuario_id": int(r.usuario_id),
            "nome": r.nome,
            "role": r.role,
            "vendas": int(r.vendas),
            "itens": int(r.itens),
            "volume": round(float(r.volume), 2),
            "ticket_medio": ticket,
        })
    return resultado


# ─── Auditoria ──────────────────────────────────────────────

@router.get("/auditoria", response_model=List[AuditLogResponse])
def listar_auditoria(
    acao: Optional[str] = None,
    usuario_id: Optional[int] = None,
    entidade_tipo: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Acessa o log de auditoria (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    logs = AuditService.listar(
        db=db,
        limit=limit,
        offset=offset,
        acao=acao,
        usuario_id=usuario_id,
        entidade_tipo=entidade_tipo,
    )
    return [AuditLogResponse.model_validate(l) for l in logs]


@router.get("/auditoria/acoes")
def listar_tipos_acao(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os tipos de ação de auditoria disponíveis."""
    from ..models.audit_log import AuditLog

    acoes = (
        db.query(AuditLog.acao)
        .distinct()
        .order_by(AuditLog.acao)
        .all()
    )
    return [a[0] for a in acoes]


# ─── Alertas ─────────────────────────────────────────────────

@router.get("/alertas/config", response_model=List[AlertaConfigResponse])
def listar_config_alertas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista configurações de alerta."""
    configs = db.query(AlertaConfig).all()
    return [AlertaConfigResponse.model_validate(c) for c in configs]


@router.post("/alertas/config", response_model=AlertaConfigResponse)
def criar_config_alerta(
    data: AlertaConfigCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria uma nova configuração de alerta."""
    verificar_role(current_user, ["admin"])

    config = AlertaConfig(**data.model_dump())
    db.add(config)
    db.commit()
    db.refresh(config)
    return AlertaConfigResponse.model_validate(config)


@router.put("/alertas/config/{config_id}", response_model=AlertaConfigResponse)
def atualizar_config_alerta(
    config_id: int,
    data: AlertaConfigCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza uma configuração de alerta."""
    verificar_role(current_user, ["admin"])

    config = db.query(AlertaConfig).filter(AlertaConfig.id == config_id).first()
    if not config:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Configuração de alerta não encontrada")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)
    return AlertaConfigResponse.model_validate(config)


@router.get("/alertas/historico")
def historico_alertas(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Histórico de alertas disparados."""
    alertas = (
        db.query(AlertaDisparado)
        .order_by(AlertaDisparado.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": a.id,
            "tipo": a.tipo,
            "mensagem": a.mensagem,
            "canal": a.canal,
            "entregue": a.entregue,
            "data": a.created_at.isoformat(),
        }
        for a in alertas
    ]


# ─── Dashboard Executivo ────────────────────────────────────

@router.get("/dashboard-executivo")
def dashboard_executivo(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Dashboard executivo com principais indicadores."""
    try:
        from datetime import datetime, timedelta, date
        from sqlalchemy import func, text

        hoje = date.today()
        inicio_mes = date(hoje.year, hoje.month, 1)

        # Receita do mês
        sql_receita_mes = text("""
            SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND DATE(m.data) >= :inicio_mes
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
        """)
        receita_mes = db.execute(
            sql_receita_mes, {"inicio_mes": inicio_mes}
        ).scalar() or 0.0

        # Total de insumos cadastrados
        from ..models.insumo import Insumo as InsumoModel
        total_insumos = db.query(func.count(InsumoModel.id)).scalar() or 0

        # Total de produtos
        from ..models.produto import Produto as ProdutoModel
        total_produtos = db.query(func.count(ProdutoModel.id)).scalar() or 0

        # Insumos críticos (abaixo do mínimo)
        insumos_criticos = EstoqueService.verificar_estoque_minimo(db)
        insumos_criticos_count = len(insumos_criticos)

        # Últimas movimentações
        from ..models.movimentacao import Movimentacao
        ultimas_movs = (
            db.query(Movimentacao)
            .order_by(Movimentacao.data.desc())
            .limit(10)
            .all()
        )

        # Receita dos últimos 7 dias (inclusive hoje)
        sql_receita_ultimos_dias = text("""
            SELECT DATE(m.data) AS dia, COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0) AS receita
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND m.data >= :di
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
            GROUP BY DATE(m.data)
            ORDER BY dia
        """)
        inicio_7d = hoje - timedelta(days=6)
        rows_7d = db.execute(
            sql_receita_ultimos_dias, {"di": datetime.combine(inicio_7d, datetime.min.time())}
        ).fetchall()
        receita_por_dia = {r.dia: round(r.receita or 0, 2) for r in rows_7d}
        receita_ultimos_dias = [
            {
                "dia": (inicio_7d + timedelta(days=i)).isoformat(),
                "receita": receita_por_dia.get((inicio_7d + timedelta(days=i)).isoformat(), 0),
            }
            for i in range(7)
        ]

        return {
            "indicadores": {
                "receita_mes": round(receita_mes, 2),
                "total_insumos": total_insumos,
                "total_produtos": total_produtos,
                "insumos_criticos": insumos_criticos_count,
            },
            "receita_ultimos_dias": receita_ultimos_dias,
            "ultimas_movimentacoes": [
                {
                    "id": m.id,
                    "tipo": m.tipo,
                    "quantidade": m.quantidade,
                    "custo_no_momento": m.custo_no_momento,
                    "insumo_id": m.insumo_id,
                    "produto_id": m.produto_id,
                    "quantidade_produto": m.quantidade_produto,
                    "created_at": m.data.isoformat(),
                }
                for m in ultimas_movs
            ],
        }
    except Exception as e:
        logger.exception(f"[DASHBOARD] Erro ao carregar dashboard: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor. Consulte os logs.")
