"""
BARIZE - Rotas de Caixa
Pilar 6: Operacional - Rotina de Fechamento de Caixa
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import date

from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.caixa import CaixaCreate, CaixaResponse, FechamentoCreate
from ..services.auth_service import get_current_user, verificar_role
from ..services.caixa_service import CaixaService
from ..services.audit_service import AuditService

router = APIRouter(prefix="/caixa", tags=["Caixa"])


@router.post("/abrir")
def abrir_caixa(
    data: CaixaCreate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Abre um novo caixa (início do expediente)."""
    sucesso, msg, caixa = CaixaService.abrir_caixa(
        db=db,
        usuario_id=current_user.id,
        saldo_inicial=data.saldo_inicial,
    )

    if not sucesso:
        raise HTTPException(status_code=400, detail=msg)

    AuditService.registrar(
        db=db,
        acao="CAIXA_ABERTO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Caixa",
        entidade_id=caixa.id,
        descricao=f"Caixa #{caixa.id} aberto com R${data.saldo_inicial:.2f}",
        ip_origem=request.client.host if request else None,
    )

    return {
        "sucesso": True,
        "mensagem": msg,
        "caixa": {
            "id": caixa.id,
            "saldo_inicial": caixa.saldo_inicial,
            "data_abertura": caixa.data_abertura.isoformat(),
        },
    }


@router.post("/fechar/{caixa_id}")
def fechar_caixa(
    caixa_id: int,
    data: FechamentoCreate,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Fecha o caixa com conciliação de valores."""
    sucesso, msg, resultado = CaixaService.fechar_caixa(
        db=db,
        caixa_id=caixa_id,
        valores_declarados=data.valores_declarados,
        observacao=data.observacao,
    )

    if not sucesso:
        raise HTTPException(status_code=400, detail=msg)

    # Registrar no audit trail
    AuditService.registrar(
        db=db,
        acao="CAIXA_FECHADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Caixa",
        entidade_id=caixa_id,
        descricao=(
            f"Caixa #{caixa_id} fechado. "
            f"Esperado: R${resultado['saldo_esperado']:.2f} | "
            f"Declarado: R${resultado['saldo_declarado']:.2f} | "
            f"Diferença: R${resultado['diferenca']:+.2f}"
        ),
        estado_novo=resultado,
        ip_origem=request.client.host if request else None,
    )

    return {
        "sucesso": True,
        "mensagem": msg,
        "resultado": resultado,
    }


@router.get("/aberto")
def caixa_aberto(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Retorna o caixa atualmente aberto, se houver."""
    from ..models.caixa import Caixa as CaixaModel

    caixa = (
        db.query(CaixaModel)
        .filter(CaixaModel.status == "ABERTO")
        .first()
    )

    if not caixa:
        return {"caixa_aberto": False, "caixa": None}

    return {
        "caixa_aberto": True,
        "caixa": {
            "id": caixa.id,
            "usuario_id": caixa.usuario_id,
            "saldo_inicial": caixa.saldo_inicial,
            "data_abertura": caixa.data_abertura.isoformat(),
        },
    }


@router.get("/resumo-diario")
def resumo_diario(
    data: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Resumo financeiro do dia."""
    resultado = CaixaService.obter_resumo_diario(db=db, data=data)
    return resultado
