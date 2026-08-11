"""
BARIZE - Rotas de Copos Quebrados (Registro de Perdas)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.copo import Copo
from ..models.copo_quebrado import CopoQuebrado
from ..schemas.copo_quebrado import CopoQuebradoCreate, CopoQuebradoResponse, CopoQuebradoResumo
from ..services.auth_service import get_current_user, verificar_role
from ..services.audit_service import AuditService

router = APIRouter(prefix="/copos-quebrados", tags=["Copos Quebrados"])


@router.get("/", response_model=List[CopoQuebradoResponse])
def listar_quebras(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os registros de copos quebrados."""
    quebras = (
        db.query(CopoQuebrado)
        .order_by(CopoQuebrado.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [CopoQuebradoResponse.model_validate(q) for q in quebras]


@router.get("/resumo", response_model=CopoQuebradoResumo)
def resumo_quebras(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Resumo de copos quebrados: hoje, esta semana, este mês, custo total."""
    agora = datetime.now(timezone.utc)
    inicio_hoje = agora.replace(hour=0, minute=0, second=0, microsecond=0)
    inicio_semana = inicio_hoje - timedelta(days=agora.weekday())
    inicio_mes = agora.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def contar_desde(data_inicio):
        return (
            db.query(CopoQuebrado)
            .filter(CopoQuebrado.created_at >= data_inicio)
            .count()
        )

    custo_total = (
        db.query(CopoQuebrado)
        .with_entities(CopoQuebrado.valor_total)
        .all()
    )
    custo_total = round(sum(v[0] or 0 for v in custo_total), 2)

    return CopoQuebradoResumo(
        total_hoje=contar_desde(inicio_hoje),
        total_semana=contar_desde(inicio_semana),
        total_mes=contar_desde(inicio_mes),
        total_quebras=db.query(CopoQuebrado).count(),
        custo_total=custo_total,
    )


@router.post("/", response_model=CopoQuebradoResponse, status_code=201)
def registrar_quebra(
    data: CopoQuebradoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Registra uma quebra de copo. Deduz do estoque."""
    verificar_role(current_user, ["admin", "gerente"])

    copo = db.query(Copo).filter(Copo.id == data.copo_id, Copo.deleted_at.is_(None)).first()
    if not copo:
        raise HTTPException(status_code=404, detail="Copo não encontrado")

    if copo.estoque_atual < data.quantidade:
        raise HTTPException(
            status_code=400,
            detail=f"Estoque insuficiente. Disponível: {copo.estoque_atual}, solicitado: {data.quantidade}",
        )

    valor_total = round(data.quantidade * copo.custo_unitario, 2)

    quebra = CopoQuebrado(
        copo_id=data.copo_id,
        quantidade=data.quantidade,
        motivo=data.motivo,
        valor_total=valor_total,
        registrado_por=current_user.nome,
    )
    db.add(quebra)

    copo.estoque_atual -= data.quantidade
    db.commit()
    db.refresh(quebra)

    AuditService.registrar(
        db=db,
        acao="COPO_QUEBRADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="CopoQuebrado",
        entidade_id=quebra.id,
        descricao=f"Quebra: {data.quantidade}x '{copo.nome}' (R${valor_total:.2f}) - {data.motivo or 'sem motivo'}",
    )

    return CopoQuebradoResponse.model_validate(quebra)


@router.delete("/{quebra_id}")
def excluir_quebra(
    quebra_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Exclui um registro de quebra (admin apenas)."""
    verificar_role(current_user, ["admin"])

    quebra = db.query(CopoQuebrado).filter(CopoQuebrado.id == quebra_id).first()
    if not quebra:
        raise HTTPException(status_code=404, detail="Registro de quebra não encontrado")

    db.delete(quebra)
    db.commit()

    AuditService.registrar(
        db=db,
        acao="QUEBRA_EXCLUIDA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="CopoQuebrado",
        entidade_id=quebra_id,
        descricao=f"Registro de quebra #{quebra_id} excluído",
    )

    return {"sucesso": True, "mensagem": f"Registro de quebra #{quebra_id} excluído"}
