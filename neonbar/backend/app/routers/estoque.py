"""
BARIZE - Rotas de Estoque
Pilar 3: Banco de Dados - Controle completo de entradas e saídas
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from loguru import logger

from ..database import get_db
from ..models.insumo import Insumo
from ..models.usuario import Usuario
from ..models.movimentacao import Movimentacao
from ..schemas.insumo import InsumoCreate, InsumoResponse, InsumoUpdate
from ..schemas.movimentacao import MovimentacaoCreate, MovimentacaoResponse
from ..services.auth_service import get_current_user, verificar_role
from ..services.estoque_service import EstoqueService
from ..services.audit_service import AuditService

router = APIRouter(prefix="/estoque", tags=["Estoque"])


# ─── Insumos ────────────────────────────────────────────────

@router.get("/insumos", response_model=List[InsumoResponse])
def listar_insumos(
    ativos: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    """Lista todos os insumos."""
    query = db.query(Insumo)
    if ativos is not None:
        query = query.filter(Insumo.ativo == (1 if ativos else 0))
    insumos = query.order_by(Insumo.nome).limit(limit).offset(offset).all()
    return [InsumoResponse.model_validate(i) for i in insumos]


@router.post("/insumos", response_model=InsumoResponse)
def criar_insumo(
    data: InsumoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria um novo insumo."""
    verificar_role(current_user, ["admin", "gerente"])

    existe = db.query(Insumo).filter(Insumo.nome == data.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Insumo com este nome já existe")

    insumo = Insumo(**data.model_dump())
    db.add(insumo)
    db.commit()
    db.refresh(insumo)

    AuditService.registrar(
        db=db,
        acao="INSUMO_CRIADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Insumo",
        entidade_id=insumo.id,
        descricao=f"Insumo '{insumo.nome}' criado",
    )

    return InsumoResponse.model_validate(insumo)


@router.put("/insumos/{insumo_id}", response_model=InsumoResponse)
def atualizar_insumo(
    insumo_id: int,
    data: InsumoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza dados de um insumo (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")

    estado_anterior = {
        "nome": insumo.nome,
        "estoque_atual": insumo.estoque_atual,
        "estoque_minimo": insumo.estoque_minimo,
        "custo_unitario": insumo.custo_unitario,
    }

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(insumo, field, value)

    db.commit()
    db.refresh(insumo)

    AuditService.registrar(
        db=db,
        acao="INSUMO_ALTERADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Insumo",
        entidade_id=insumo.id,
        descricao=f"Insumo '{insumo.nome}' alterado",
        estado_anterior=estado_anterior,
    )

    return InsumoResponse.model_validate(insumo)


@router.delete("/insumos/{insumo_id}")
def excluir_insumo(
    insumo_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Exclui (soft delete) um insumo (admin)."""
    verificar_role(current_user, ["admin"])

    insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
    if not insumo:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")

    # Soft delete
    insumo.ativo = 0

    AuditService.registrar(
        db=db,
        acao="INSUMO_EXCLUIDO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Insumo",
        entidade_id=insumo.id,
        descricao=f"Insumo '{insumo.nome}' desativado (soft delete)",
        estado_anterior={"nome": insumo.nome, "estoque_atual": insumo.estoque_atual},
    )

    db.commit()
    return {"sucesso": True, "mensagem": "Insumo desativado"}


# ─── Movimentações ──────────────────────────────────────────

@router.post("/entrada")
def entrada_mercadoria(
    data: MovimentacaoCreate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Registra entrada de mercadoria (compra)."""
    verificar_role(current_user, ["admin", "gerente"])

    if data.tipo != "COMPRA":
        raise HTTPException(status_code=400, detail="Tipo deve ser COMPRA para entrada")

    sucesso, msg = EstoqueService.dar_entrada(
        db=db,
        insumo_id=data.insumo_id,
        quantidade=data.quantidade,
        custo_compra=data.custo_no_momento,
        documento_referencia=data.documento_referencia,
        observacao=data.observacao,
        usuario_id=current_user.id,
    )

    if not sucesso:
        raise HTTPException(status_code=400, detail=msg)

    AuditService.registrar(
        db=db,
        acao="ESTOQUE_ENTRADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Movimentacao",
        descricao=msg,
        ip_origem=request.client.host if request else None,
    )

    return {"sucesso": True, "mensagem": msg}


@router.post("/ajuste")
def ajustar_estoque(
    insumo_id: int,
    novo_estoque: float,
    motivo: str,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Ajuste manual de inventário."""
    verificar_role(current_user, ["admin", "gerente"])

    sucesso, msg = EstoqueService.ajustar_estoque(
        db=db,
        insumo_id=insumo_id,
        novo_estoque=novo_estoque,
        motivo=motivo,
        usuario_id=current_user.id,
    )

    if not sucesso:
        raise HTTPException(status_code=400, detail=msg)

    AuditService.registrar(
        db=db,
        acao="ESTOQUE_AJUSTE",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Insumo",
        entidade_id=insumo_id,
        descricao=msg,
        motivo=motivo,
        ip_origem=request.client.host if request else None,
    )

    return {"sucesso": True, "mensagem": msg}


@router.post("/perda")
def registrar_perda(
    insumo_id: int,
    quantidade: float,
    motivo: str,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Registra perda/quebra/vencimento."""
    verificar_role(current_user, ["admin", "gerente"])

    sucesso, msg = EstoqueService.registrar_perda(
        db=db,
        insumo_id=insumo_id,
        quantidade=quantidade,
        motivo=motivo,
        usuario_id=current_user.id,
    )

    if not sucesso:
        raise HTTPException(status_code=400, detail=msg)

    AuditService.registrar(
        db=db,
        acao="PERDA_REGISTRADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Insumo",
        entidade_id=insumo_id,
        descricao=msg,
        motivo=motivo,
        ip_origem=request.client.host if request else None,
    )

    return {"sucesso": True, "mensagem": msg}


@router.get("/movimentacoes", response_model=List[MovimentacaoResponse])
def listar_movimentacoes(
    insumo_id: Optional[int] = None,
    tipo: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista histórico de movimentações."""
    query = db.query(Movimentacao)

    if insumo_id:
        query = query.filter(Movimentacao.insumo_id == insumo_id)
    if tipo:
        query = query.filter(Movimentacao.tipo == tipo)

    movs = (
        query
        .order_by(Movimentacao.data.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [MovimentacaoResponse.model_validate(m) for m in movs]


@router.get("/insumos-baixo-estoque")
def insumos_estoque_baixo(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista insumos abaixo do estoque mínimo."""
    insumos = EstoqueService.verificar_estoque_minimo(db)
    return [
        {
            "id": i.id,
            "nome": i.nome,
            "estoque_atual": i.estoque_atual,
            "estoque_minimo": i.estoque_minimo,
            "unidade_medida": i.unidade_medida,
            "diferenca": round(i.estoque_atual - i.estoque_minimo, 2),
        }
        for i in insumos
    ]
