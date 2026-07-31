"""
BARIZE - Rotas de Copos (Gestão de Copa)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.copo import Copo
from ..schemas.copo import CopoCreate, CopoUpdate, CopoResponse
from ..services.auth_service import get_current_user, verificar_role
from ..services.audit_service import AuditService

router = APIRouter(prefix="/copos", tags=["Copos"])


@router.get("/", response_model=List[CopoResponse])
def listar_copos(
    baixo_estoque: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os copos cadastrados. Use ?baixo_estoque=true para filtrar."""
    query = db.query(Copo).filter(Copo.deleted_at.is_(None))
    if baixo_estoque:
        query = query.filter(Copo.estoque_atual <= Copo.estoque_minimo)
    copos = query.order_by(Copo.nome).all()
    return [CopoResponse.model_validate(c) for c in copos]


@router.get("/{copo_id}", response_model=CopoResponse)
def obter_copo(
    copo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtém detalhes de um copo."""
    copo = db.query(Copo).filter(Copo.id == copo_id, Copo.deleted_at.is_(None)).first()
    if not copo:
        raise HTTPException(status_code=404, detail="Copo não encontrado")
    return CopoResponse.model_validate(copo)


@router.post("/", response_model=CopoResponse, status_code=201)
def criar_copo(
    data: CopoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria um novo tipo de copo (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    existe = db.query(Copo).filter(Copo.nome == data.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Copo com este nome já existe")

    copo = Copo(**data.model_dump())
    db.add(copo)
    db.commit()
    db.refresh(copo)

    AuditService.registrar(
        db=db,
        acao="COPO_CRIADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Copo",
        entidade_id=copo.id,
        descricao=f"Copo '{copo.nome}' criado",
    )

    return CopoResponse.model_validate(copo)


@router.put("/{copo_id}", response_model=CopoResponse)
def atualizar_copo(
    copo_id: int,
    data: CopoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza dados de um copo (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    copo = db.query(Copo).filter(Copo.id == copo_id, Copo.deleted_at.is_(None)).first()
    if not copo:
        raise HTTPException(status_code=404, detail="Copo não encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(copo, field, value)

    db.commit()
    db.refresh(copo)

    AuditService.registrar(
        db=db,
        acao="COPO_ALTERADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Copo",
        entidade_id=copo.id,
        descricao=f"Copo '{copo.nome}' alterado",
    )

    return CopoResponse.model_validate(copo)


@router.delete("/{copo_id}")
def excluir_copo(
    copo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Exclui (soft delete) um copo (admin)."""
    verificar_role(current_user, ["admin"])

    copo = db.query(Copo).filter(Copo.id == copo_id, Copo.deleted_at.is_(None)).first()
    if not copo:
        raise HTTPException(status_code=404, detail="Copo não encontrado")

    from datetime import datetime, timezone
    copo.deleted_at = datetime.now(timezone.utc)
    db.commit()

    AuditService.registrar(
        db=db,
        acao="COPO_EXCLUIDO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Copo",
        entidade_id=copo.id,
        descricao=f"Copo '{copo.nome}' excluído (soft delete)",
    )

    return {"sucesso": True, "mensagem": f"Copo '{copo.nome}' excluído"}


@router.post("/{copo_id}/entrada")
def entrada_copos(
    copo_id: int,
    quantidade: int = Query(..., ge=1),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Adiciona estoque de copos (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    copo = db.query(Copo).filter(Copo.id == copo_id, Copo.deleted_at.is_(None)).first()
    if not copo:
        raise HTTPException(status_code=404, detail="Copo não encontrado")

    copo.estoque_atual += quantidade
    db.commit()

    AuditService.registrar(
        db=db,
        acao="COPO_ENTRADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Copo",
        entidade_id=copo.id,
        descricao=f"Entrada de {quantidade}x '{copo.nome}' (estoque: {copo.estoque_atual})",
    )

    return {
        "sucesso": True,
        "copo": copo.nome,
        "quantidade_adicionada": quantidade,
        "estoque_atual": copo.estoque_atual,
    }
