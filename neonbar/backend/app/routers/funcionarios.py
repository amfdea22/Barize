from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.funcionario import Funcionario
from ..services.auth_service import get_current_user, verificar_role
from ..schemas.funcionario import (
    FuncionarioCreate,
    FuncionarioUpdate,
    FuncionarioResponse,
    FuncionarioListItem,
    FuncionarioVincularUsuario,
)

router = APIRouter(prefix="/admin/funcionarios", tags=["Admin - Funcionários"])


def _serialize_funcionario(f: Funcionario) -> dict:
    return {
        "id": f.id,
        "nome": f.nome,
        "cpf": f.cpf,
        "rg": f.rg,
        "data_nascimento": f.data_nascimento.isoformat() if f.data_nascimento else None,
        "telefone": f.telefone,
        "email": f.email,
        "endereco": f.endereco,
        "foto_url": f.foto_url,
        "cargo": f.cargo,
        "data_admissao": f.data_admissao.isoformat() if f.data_admissao else None,
        "data_demissao": f.data_demissao.isoformat() if f.data_demissao else None,
        "motivo_demissao": f.motivo_demissao,
        "salario_hora": f.salario_hora,
        "tipo_contrato": f.tipo_contrato,
        "turno": f.turno,
        "dias_semana": f.dias_semana,
        "carga_horaria_semanal": f.carga_horaria_semanal,
        "ativo": bool(f.ativo),
        "observacoes": f.observacoes,
        "usuario_id": f.usuario_id,
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }


@router.get("/", response_model=List[FuncionarioListItem])
def listar_funcionarios(
    cargo: Optional[str] = Query(default=None),
    ativo: Optional[int] = Query(default=None),
    busca: Optional[str] = Query(default=None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista funcionários com filtros (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    query = db.query(Funcionario)
    if cargo:
        query = query.filter(Funcionario.cargo == cargo)
    if ativo is not None:
        query = query.filter(Funcionario.ativo == ativo)
    if busca:
        query = query.filter(
            (Funcionario.nome.ilike(f"%{busca}%")) | (Funcionario.cpf.ilike(f"%{busca}%"))
        )

    funcionarios = query.order_by(Funcionario.nome).limit(limit).offset(offset).all()
    return [
        {
            "id": f.id,
            "nome": f.nome,
            "cpf": f.cpf,
            "cargo": f.cargo,
            "turno": f.turno,
            "data_admissao": f.data_admissao,
            "ativo": f.ativo,
            "foto_url": f.foto_url,
        }
        for f in funcionarios
    ]


@router.get("/ativos", response_model=List[FuncionarioListItem])
def listar_funcionarios_ativos(
    cargo: Optional[str] = Query(default=None),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista funcionários ativos para escalas/PDV (admin/gerente/bartender)."""
    verificar_role(current_user, ["admin", "gerente", "bartender"])

    query = db.query(Funcionario).filter(Funcionario.ativo == 1)
    if cargo:
        query = query.filter(Funcionario.cargo == cargo)

    funcionarios = query.order_by(Funcionario.nome).limit(limit).offset(offset).all()
    return [
        {
            "id": f.id,
            "nome": f.nome,
            "cpf": f.cpf,
            "cargo": f.cargo,
            "turno": f.turno,
            "data_admissao": f.data_admissao,
            "ativo": f.ativo,
            "foto_url": f.foto_url,
        }
        for f in funcionarios
    ]


@router.get("/{funcionario_id}", response_model=FuncionarioResponse)
def obter_funcionario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtém detalhes de um funcionário (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    f = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")
    return _serialize_funcionario(f)


@router.post("/", response_model=FuncionarioResponse, status_code=201)
def criar_funcionario(
    data: FuncionarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria um novo funcionário (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    # Verifica CPF duplicado
    cpf_limpo = "".join(filter(str.isdigit, data.cpf))
    existente = db.query(Funcionario).filter(Funcionario.cpf == cpf_limpo).first()
    if existente:
        raise HTTPException(status_code=409, detail="CPF já cadastrado")

    # Se usuario_id informado, valida
    if data.usuario_id:
        usuario = db.query(Usuario).filter(Usuario.id == data.usuario_id).first()
        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        # Verifica se usuário já tem funcionário vinculado
        if usuario.funcionario:
            raise HTTPException(status_code=409, detail="Usuário já possui funcionário vinculado")

    funcionario = Funcionario(
        nome=data.nome,
        cpf=cpf_limpo,
        rg=data.rg,
        data_nascimento=data.data_nascimento,
        telefone=data.telefone,
        email=data.email,
        endereco=data.endereco,
        foto_url=data.foto_url,
        cargo=data.cargo,
        data_admissao=data.data_admissao,
        data_demissao=data.data_demissao,
        motivo_demissao=data.motivo_demissao,
        salario_hora=data.salario_hora,
        tipo_contrato=data.tipo_contrato,
        turno=data.turno,
        dias_semana=data.dias_semana,
        carga_horaria_semanal=data.carga_horaria_semanal,
        observacoes=data.observacoes,
        usuario_id=data.usuario_id,
        ativo=1,
    )
    db.add(funcionario)
    db.commit()
    db.refresh(funcionario)
    logger.info(f"[Funcionário] Criado: {funcionario.nome} (CPF: {funcionario.cpf})")
    return _serialize_funcionario(funcionario)


@router.put("/{funcionario_id}", response_model=FuncionarioResponse)
def atualizar_funcionario(
    funcionario_id: int,
    data: FuncionarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza um funcionário (admin)."""
    verificar_role(current_user, ["admin"])

    f = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    # Se CPF sendo alterado, valida duplicidade
    if data.cpf is not None:
        cpf_limpo = "".join(filter(str.isdigit, data.cpf))
        existente = db.query(Funcionario).filter(
            Funcionario.cpf == cpf_limpo, Funcionario.id != funcionario_id
        ).first()
        if existente:
            raise HTTPException(status_code=409, detail="CPF já cadastrado")
        f.cpf = cpf_limpo

    for campo in [
        "nome", "rg", "data_nascimento", "telefone", "email", "endereco",
        "foto_url",
        "cargo", "data_admissao", "data_demissao", "motivo_demissao",
        "salario_hora", "tipo_contrato", "turno", "dias_semana",
        "carga_horaria_semanal", "ativo", "observacoes",
    ]:
        valor = getattr(data, campo, None)
        if valor is not None:
            setattr(f, campo, valor)

    db.commit()
    db.refresh(f)
    return _serialize_funcionario(f)


@router.delete("/{funcionario_id}")
def desligar_funcionario(
    funcionario_id: int,
    data_demissao: Optional[date] = Query(default=None),
    motivo: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Desliga (soft delete) um funcionário (admin)."""
    verificar_role(current_user, ["admin"])

    f = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    f.ativo = 0
    f.data_demissao = data_demissao or date.today()
    if motivo:
        f.motivo_demissao = motivo
    db.commit()
    return {"mensagem": f"Funcionário '{f.nome}' desligado com sucesso"}


@router.post("/{funcionario_id}/vincular-usuario")
def vincular_usuario(
    funcionario_id: int,
    data: FuncionarioVincularUsuario,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Vincula um funcionário a um usuário do sistema (admin)."""
    verificar_role(current_user, ["admin"])

    f = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    usuario = db.query(Usuario).filter(Usuario.id == data.usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if usuario.funcionario:
        raise HTTPException(status_code=409, detail="Usuário já possui funcionário vinculado")

    if f.usuario_id:
        raise HTTPException(status_code=409, detail="Funcionário já possui usuário vinculado")

    f.usuario_id = usuario.id
    db.commit()
    return {"mensagem": f"Funcionário '{f.nome}' vinculado ao usuário '{usuario.nome}'"}


@router.delete("/{funcionario_id}/desvincular-usuario")
def desvincular_usuario(
    funcionario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Desvincula funcionário do usuário (admin)."""
    verificar_role(current_user, ["admin"])

    f = db.query(Funcionario).filter(Funcionario.id == funcionario_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Funcionário não encontrado")

    if not f.usuario_id:
        raise HTTPException(status_code=400, detail="Funcionário não possui usuário vinculado")

    f.usuario_id = None
    db.commit()
    return {"mensagem": f"Usuário desvinculado do funcionário '{f.nome}'"}