from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.mesa import Mesa
from ..services.auth_service import get_current_user, verificar_role
from ..schemas.mesa import MesaCreate, MesaUpdate, MesaResponse

router = APIRouter(prefix="/admin/mesas", tags=["Admin - Mesas"])


@router.get("/", response_model=List[MesaResponse])
def listar_mesas(
    ativo: Optional[int] = Query(default=None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista mesas (qualquer usuário autenticado — PDV precisa listar)."""
    query = db.query(Mesa)
    if ativo is not None:
        query = query.filter(Mesa.ativo == ativo)
    mesas = query.order_by(Mesa.nome).limit(limit).offset(offset).all()
    return mesas


@router.post("/", response_model=MesaResponse, status_code=201)
def criar_mesa(
    data: MesaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria uma mesa (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    nome = data.nome.strip()
    if not nome:
        raise HTTPException(status_code=422, detail="Nome da mesa não pode ser vazio")
    existente = db.query(Mesa).filter(Mesa.nome == nome).first()
    if existente:
        raise HTTPException(status_code=409, detail="Já existe uma mesa com este nome")

    mesa = Mesa(nome=nome, local=data.local)
    db.add(mesa)
    db.commit()
    db.refresh(mesa)
    logger.info(f"[Mesa] Criada: {mesa.nome}")
    return mesa


@router.put("/{mesa_id}", response_model=MesaResponse)
def atualizar_mesa(
    mesa_id: int,
    data: MesaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza uma mesa (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    m = db.query(Mesa).filter(Mesa.id == mesa_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")

    if data.nome is not None:
        nome = data.nome.strip()
        if not nome:
            raise HTTPException(status_code=422, detail="Nome da mesa não pode ser vazio")
        existente = db.query(Mesa).filter(Mesa.nome == nome, Mesa.id != mesa_id).first()
        if existente:
            raise HTTPException(status_code=409, detail="Já existe uma mesa com este nome")
        m.nome = nome
    if data.local is not None:
        m.local = data.local
    if data.ativo is not None:
        m.ativo = data.ativo

    db.commit()
    db.refresh(m)
    return m


@router.delete("/{mesa_id}")
def desativar_mesa(
    mesa_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Desativa (soft delete) uma mesa (admin)."""
    verificar_role(current_user, ["admin"])

    m = db.query(Mesa).filter(Mesa.id == mesa_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")

    m.ativo = 0
    db.commit()
    return {"mensagem": f"Mesa '{m.nome}' desativada com sucesso"}
