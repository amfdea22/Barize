"""
BARIZE - Rotas de Materiais (Itens de Consumo)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.material import Material
from ..schemas.material import MaterialCreate, MaterialUpdate, MaterialResponse
from ..services.auth_service import get_current_user, verificar_role
from ..services.audit_service import AuditService

router = APIRouter(prefix="/materiais", tags=["Materiais"])


@router.get("/", response_model=List[MaterialResponse])
def listar_materiais(
    baixo_estoque: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os materiais. Use ?baixo_estoque=true para filtrar."""
    query = db.query(Material).filter(Material.deleted_at.is_(None))
    if baixo_estoque:
        query = query.filter(Material.estoque_atual <= Material.estoque_minimo)
    materiais = query.order_by(Material.nome).all()
    return [MaterialResponse.model_validate(m) for m in materiais]


@router.get("/{material_id}", response_model=MaterialResponse)
def obter_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtém detalhes de um material."""
    material = db.query(Material).filter(Material.id == material_id, Material.deleted_at.is_(None)).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    return MaterialResponse.model_validate(material)


@router.post("/", response_model=MaterialResponse, status_code=201)
def criar_material(
    data: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria um novo material (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    existe = db.query(Material).filter(Material.nome == data.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Material com este nome já existe")

    material = Material(**data.model_dump())
    db.add(material)
    db.commit()
    db.refresh(material)

    AuditService.registrar(
        db=db,
        acao="MATERIAL_CRIADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Material",
        entidade_id=material.id,
        descricao=f"Material '{material.nome}' criado",
    )

    return MaterialResponse.model_validate(material)


@router.put("/{material_id}", response_model=MaterialResponse)
def atualizar_material(
    material_id: int,
    data: MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza dados de um material (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    material = db.query(Material).filter(Material.id == material_id, Material.deleted_at.is_(None)).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(material, field, value)

    db.commit()
    db.refresh(material)

    AuditService.registrar(
        db=db,
        acao="MATERIAL_ALTERADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Material",
        entidade_id=material.id,
        descricao=f"Material '{material.nome}' alterado",
    )

    return MaterialResponse.model_validate(material)


@router.delete("/{material_id}")
def excluir_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Exclui (soft delete) um material (admin)."""
    verificar_role(current_user, ["admin"])

    material = db.query(Material).filter(Material.id == material_id, Material.deleted_at.is_(None)).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    from datetime import datetime, timezone
    material.deleted_at = datetime.now(timezone.utc)
    db.commit()

    AuditService.registrar(
        db=db,
        acao="MATERIAL_EXCLUIDO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Material",
        entidade_id=material.id,
        descricao=f"Material '{material.nome}' excluído (soft delete)",
    )

    return {"sucesso": True, "mensagem": f"Material '{material.nome}' excluído"}


@router.post("/{material_id}/entrada")
def entrada_materiais(
    material_id: int,
    quantidade: int = Query(..., ge=1),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Adiciona estoque de material (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    material = db.query(Material).filter(Material.id == material_id, Material.deleted_at.is_(None)).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado")

    material.estoque_atual += quantidade
    db.commit()

    AuditService.registrar(
        db=db,
        acao="MATERIAL_ENTRADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Material",
        entidade_id=material.id,
        descricao=f"Entrada de {quantidade}x '{material.nome}' (estoque: {material.estoque_atual})",
    )

    return {
        "sucesso": True,
        "material": material.nome,
        "quantidade_adicionada": quantidade,
        "estoque_atual": material.estoque_atual,
    }
