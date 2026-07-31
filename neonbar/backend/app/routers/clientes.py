from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger

from ..database import get_db
from ..models.cliente import Cliente
from ..models.usuario import Usuario
from ..schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, min_length=1),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(Cliente)
    if search:
        filtro = (
            Cliente.nome.ilike(f"%{search}%")
            | Cliente.cpf_cnpj.ilike(f"%{search}%")
            | Cliente.telefone.ilike(f"%{search}%")
            | Cliente.email.ilike(f"%{search}%")
        )
        query = query.filter(filtro)
    clientes = query.order_by(Cliente.nome).offset(offset).limit(limit).all()
    return clientes


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obter_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.post("/", response_model=ClienteResponse, status_code=201)
def criar_cliente(
    data: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente", "bartender"])
    if data.cpf_cnpj:
        existente = db.query(Cliente).filter(Cliente.cpf_cnpj == data.cpf_cnpj).first()
        if existente:
            raise HTTPException(status_code=409, detail="CPF/CNPJ já cadastrado")
    cliente = Cliente(
        nome=data.nome,
        cpf_cnpj=data.cpf_cnpj,
        telefone=data.telefone,
        email=data.email,
        data_nascimento=data.data_nascimento,
        acumulado_gastos=data.acumulado_gastos or 0.0,
        observacao=data.observacao,
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)
    logger.info(f"[CLIENTES] Cliente #{cliente.id} '{cliente.nome}' criado")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def atualizar_cliente(
    cliente_id: int,
    data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if data.nome is not None:
        cliente.nome = data.nome
    if data.cpf_cnpj is not None:
        if data.cpf_cnpj != cliente.cpf_cnpj:
            existente = db.query(Cliente).filter(Cliente.cpf_cnpj == data.cpf_cnpj).first()
            if existente:
                raise HTTPException(status_code=409, detail="CPF/CNPJ já cadastrado")
        cliente.cpf_cnpj = data.cpf_cnpj
    if data.telefone is not None:
        cliente.telefone = data.telefone
    if data.email is not None:
        cliente.email = data.email
    if data.data_nascimento is not None:
        cliente.data_nascimento = data.data_nascimento
    if data.acumulado_gastos is not None:
        cliente.acumulado_gastos = data.acumulado_gastos
    if data.observacao is not None:
        cliente.observacao = data.observacao
    if data.ativo is not None:
        cliente.ativo = data.ativo

    db.commit()
    db.refresh(cliente)
    logger.info(f"[CLIENTES] Cliente #{cliente.id} atualizado")
    return cliente


@router.delete("/{cliente_id}")
def excluir_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin"])
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    cliente.ativo = False
    db.commit()
    logger.info(f"[CLIENTES] Cliente #{cliente.id} '{cliente.nome}' desativado")
    return {"sucesso": True, "mensagem": f"Cliente '{cliente.nome}' desativado"}
