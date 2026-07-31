from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timezone
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.pop import POP, ExecucaoPOP
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/pops", tags=["POP - Procedimentos"])


@router.get("/")
def listar_pops(
    categoria: Optional[str] = Query(default=None),
    frequencia: Optional[str] = Query(default=None),
    setor: Optional[str] = Query(default=None),
    apenas_ativos: bool = Query(default=True),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    query = db.query(POP)
    if apenas_ativos:
        query = query.filter(POP.ativo == 1)
    if categoria:
        query = query.filter(POP.categoria == categoria)
    if frequencia:
        query = query.filter(POP.frequencia == frequencia)
    if setor:
        query = query.filter(POP.setor == setor)

    pops = query.order_by(POP.categoria, POP.titulo).all()
    return [
        {
            "id": p.id,
            "titulo": p.titulo,
            "descricao": p.descricao,
            "categoria": p.categoria,
            "passos": p.passos or [],
            "frequencia": p.frequencia,
            "setor": p.setor,
            "ativo": bool(p.ativo),
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in pops
    ]


@router.post("/")
def criar_pop(
    data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = POP(
        titulo=data["titulo"],
        descricao=data.get("descricao"),
        categoria=data.get("categoria"),
        passos=data.get("passos", []),
        frequencia=data.get("frequencia", "diario"),
        setor=data.get("setor"),
    )
    db.add(pop)
    db.commit()
    db.refresh(pop)
    logger.info(f"[POP] Criado: {pop.titulo}")
    return {"mensagem": "POP criado com sucesso", "id": pop.id}


@router.put("/{pop_id}")
def atualizar_pop(
    pop_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = db.query(POP).filter(POP.id == pop_id).first()
    if not pop:
        raise HTTPException(status_code=404, detail="POP não encontrado")
    for campo in ["titulo", "descricao", "categoria", "passos", "frequencia", "setor", "ativo"]:
        if campo in data:
            setattr(pop, campo, data[campo])
    db.commit()
    return {"mensagem": "POP atualizado com sucesso"}


@router.delete("/{pop_id}")
def excluir_pop(
    pop_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = db.query(POP).filter(POP.id == pop_id).first()
    if not pop:
        raise HTTPException(status_code=404, detail="POP não encontrado")
    pop.ativo = 0
    db.commit()
    return {"mensagem": "POP desativado com sucesso"}


@router.get("/pendentes")
def listar_pendentes(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoje = datetime.now(timezone.utc).date()
    inicio_dt = datetime.combine(hoje, datetime.min.time())
    fim_dt = datetime.combine(hoje, datetime.max.time())

    pops_ativos = db.query(POP).filter(POP.ativo == 1).all()
    resultado = []

    for pop in pops_ativos:
        ja_executado = db.query(ExecucaoPOP).filter(
            ExecucaoPOP.pop_id == pop.id,
            ExecucaoPOP.realizado_em >= inicio_dt,
            ExecucaoPOP.realizado_em <= fim_dt,
            ExecucaoPOP.status == "concluido",
        ).first()

        ultima_exec = db.query(ExecucaoPOP).filter(
            ExecucaoPOP.pop_id == pop.id,
        ).order_by(ExecucaoPOP.realizado_em.desc()).first()

        resultado.append({
            "id": pop.id,
            "titulo": pop.titulo,
            "descricao": pop.descricao,
            "categoria": pop.categoria,
            "passos": pop.passos or [],
            "frequencia": pop.frequencia,
            "setor": pop.setor,
            "concluido_hoje": ja_executado is not None,
            "ultima_execucao": ultima_exec.realizado_em.isoformat() if ultima_exec else None,
            "ultimo_status": ultima_exec.status if ultima_exec else None,
        })

    return resultado


@router.post("/{pop_id}/executar")
def executar_pop(
    pop_id: int,
    data: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = db.query(POP).filter(POP.id == pop_id, POP.ativo == 1).first()
    if not pop:
        raise HTTPException(status_code=404, detail="POP não encontrado")

    payload = data or {}
    execucao = ExecucaoPOP(
        pop_id=pop_id,
        realizado_por=payload.get("realizado_por", current_user.nome),
        status="concluido",
        observacao=payload.get("observacao"),
    )
    db.add(execucao)
    db.commit()
    return {"mensagem": f"POP '{pop.titulo}' concluído com sucesso"}


@router.get("/relatorio")
def relatorio_pops(
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if not data_fim:
        data_fim = datetime.now(timezone.utc).date()
    if not data_inicio:
        data_inicio = data_fim.replace(day=1)

    inicio_dt = datetime.combine(data_inicio, datetime.min.time())
    fim_dt = datetime.combine(data_fim, datetime.max.time())

    total_pops = db.query(POP).filter(POP.ativo == 1).count()
    execucoes = db.query(ExecucaoPOP).filter(
        ExecucaoPOP.realizado_em >= inicio_dt,
        ExecucaoPOP.realizado_em <= fim_dt,
    ).count()

    return {
        "periodo": {
            "data_inicio": data_inicio.isoformat(),
            "data_fim": data_fim.isoformat(),
        },
        "total_pops_ativos": total_pops,
        "total_execucoes": execucoes,
        "taxa_conformidade": round(execucoes / (total_pops * (data_fim - data_inicio).days) * 100, 1) if total_pops > 0 else 0,
    }
