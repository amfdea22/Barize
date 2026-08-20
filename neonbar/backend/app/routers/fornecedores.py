from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.fornecedor import Fornecedor
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])


@router.get("/")
def listar_fornecedores(
    ativos: Optional[bool] = Query(default=True),
    nome: Optional[str] = Query(default=None),
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    query = db.query(Fornecedor)
    if ativos:
        query = query.filter(Fornecedor.ativo == 1)
    if nome:
        query = query.filter(Fornecedor.nome.ilike(f"%{nome}%"))
    total = query.count()
    fornecedores = query.order_by(Fornecedor.nome).offset(offset).limit(limit).all()

    return {
        "total": total,
        "fornecedores": [
            {
                "id": f.id,
                "nome": f.nome,
                "cnpj": f.cnpj,
                "contato": f.contato,
                "telefone": f.telefone,
                "email": f.email,
                "endereco": f.endereco,
                "prazo_entrega_dias": f.prazo_entrega_dias,
                "observacao": f.observacao,
                "ativo": bool(f.ativo),
                "created_at": f.created_at.isoformat() if f.created_at else None,
                "updated_at": f.updated_at.isoformat() if f.updated_at else None,
            }
            for f in fornecedores
        ],
    }


@router.get("/{fornecedor_id}")
def obter_fornecedor(
    fornecedor_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    f = db.query(Fornecedor).filter(Fornecedor.id == fornecedor_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return {
        "id": f.id,
        "nome": f.nome,
        "cnpj": f.cnpj,
        "contato": f.contato,
        "telefone": f.telefone,
        "email": f.email,
        "endereco": f.endereco,
        "prazo_entrega_dias": f.prazo_entrega_dias,
        "observacao": f.observacao,
        "ativo": bool(f.ativo),
        "created_at": f.created_at.isoformat() if f.created_at else None,
        "updated_at": f.updated_at.isoformat() if f.updated_at else None,
    }


@router.post("/")
def criar_fornecedor(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    fornecedor = Fornecedor(
        nome=data["nome"],
        cnpj=data.get("cnpj"),
        contato=data.get("contato"),
        telefone=data.get("telefone"),
        email=data.get("email"),
        endereco=data.get("endereco"),
        prazo_entrega_dias=data.get("prazo_entrega_dias", 7),
        observacao=data.get("observacao"),
    )
    db.add(fornecedor)
    db.commit()
    db.refresh(fornecedor)
    logger.info(f"[Fornecedores] Criado: {fornecedor.nome}")
    return {"mensagem": "Fornecedor criado com sucesso", "id": fornecedor.id}


@router.put("/{fornecedor_id}")
def atualizar_fornecedor(
    fornecedor_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    f = db.query(Fornecedor).filter(Fornecedor.id == fornecedor_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    for campo in ["nome", "cnpj", "contato", "telefone", "email", "endereco", "prazo_entrega_dias", "observacao"]:
        if campo in data:
            setattr(f, campo, data[campo])

    db.commit()
    db.refresh(f)
    logger.info(f"[Fornecedores] Atualizado: {f.nome}")
    return {"mensagem": "Fornecedor atualizado com sucesso"}


@router.delete("/{fornecedor_id}")
def excluir_fornecedor(
    fornecedor_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    verificar_role(current_user, ["admin", "gerente"])

    f = db.query(Fornecedor).filter(Fornecedor.id == fornecedor_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")

    f.ativo = 0
    db.commit()
    logger.info(f"[Fornecedores] Desativado: {f.nome}")
    return {"mensagem": "Fornecedor desativado com sucesso"}
