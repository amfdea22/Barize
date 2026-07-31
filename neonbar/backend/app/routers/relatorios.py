"""
BARIZE - Rotas de Relatórios e Auditoria
Pilar 5: Segurança e Auditoria - Logs de Auditoria
Pilar 6: Operacional - Relatórios
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
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
            SELECT COALESCE(SUM(p.preco_venda * ABS(m.quantidade)), 0)
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND DATE(m.data) >= :inicio_mes
            AND m.produto_id IS NOT NULL
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
            .limit(5)
            .all()
        )

        return {
            "indicadores": {
                "receita_mes": round(receita_mes, 2),
                "total_insumos": total_insumos,
                "total_produtos": total_produtos,
                "insumos_criticos": insumos_criticos_count,
            },
            "ultimas_movimentacoes": [
                {
                    "id": m.id,
                    "tipo": m.tipo,
                    "quantidade": m.quantidade,
                    "data": m.data.isoformat(),
                }
                for m in ultimas_movs
            ],
        }
    except Exception as e:
        logger.exception(f"[DASHBOARD] Erro ao carregar dashboard: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor. Consulte os logs.")
