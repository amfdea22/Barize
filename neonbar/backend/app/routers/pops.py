from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, date, timezone, timedelta
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.pop import POP, ExecucaoPOP
from ..services.auth_service import get_current_user
from ..schemas.pop import PopCreate, PopUpdate, PopResponse, PopPendente, PopExecucao

router = APIRouter(prefix="/pops", tags=["POP - Procedimentos"])

PERIODOS = {"diario": 1, "semanal": 7, "mensal": 30}


def _fluxo_aplicavel(pop: POP, fluxo: Optional[str]) -> bool:
    if not fluxo or not pop.exigencia_fluxo:
        return True
    return pop.exigencia_fluxo.get(fluxo) != "nao_aplicavel"


def _serialize(pop: POP) -> dict:
    return {
        "id": pop.id,
        "titulo": pop.titulo,
        "descricao": pop.descricao,
        "categoria": pop.categoria,
        "passos": pop.passos or [],
        "frequencia": pop.frequencia,
        "momento": pop.momento,
        "exigencia_fluxo": pop.exigencia_fluxo or {},
        "setor": pop.setor,
        "ordem": pop.ordem or 0,
        "ativo": bool(pop.ativo),
        "created_at": pop.created_at.isoformat() if pop.created_at else None,
    }


@router.get("/")
def listar_pops(
    categoria: Optional[str] = Query(default=None),
    frequencia: Optional[str] = Query(default=None),
    setor: Optional[str] = Query(default=None),
    momento: Optional[str] = Query(default=None),
    fluxo: Optional[str] = Query(default=None),
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
    if momento:
        query = query.filter(POP.momento == momento)

    pops = query.order_by(POP.frequencia, POP.setor, POP.momento, POP.ordem).all()
    if fluxo:
        pops = [p for p in pops if _fluxo_aplicavel(p, fluxo)]
    return [_serialize(p) for p in pops]


@router.post("/", response_model=PopResponse, status_code=201)
def criar_pop(
    data: PopCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = POP(
        titulo=data.titulo,
        descricao=data.descricao,
        categoria=data.categoria,
        passos=data.passos,
        frequencia=data.frequencia,
        momento=data.momento,
        exigencia_fluxo=data.exigencia_fluxo,
        setor=data.setor,
        ordem=data.ordem or 0,
    )
    db.add(pop)
    db.commit()
    db.refresh(pop)
    logger.info(f"[POP] Criado: {pop.titulo}")
    return pop


@router.put("/{pop_id}", response_model=PopResponse)
def atualizar_pop(
    pop_id: int,
    data: PopUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = db.query(POP).filter(POP.id == pop_id).first()
    if not pop:
        raise HTTPException(status_code=404, detail="POP não encontrado")
    for campo in ["titulo", "descricao", "categoria", "passos", "frequencia", "momento", "exigencia_fluxo", "setor", "ordem", "ativo"]:
        valor = getattr(data, campo, None)
        if valor is not None:
            setattr(pop, campo, valor)
    db.commit()
    db.refresh(pop)
    return pop


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
    frequencia: Optional[str] = Query(default=None),
    momento: Optional[str] = Query(default=None),
    fluxo: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    hoje = datetime.now(timezone.utc).date()

    query = db.query(POP).filter(POP.ativo == 1)
    if frequencia:
        query = query.filter(POP.frequencia == frequencia)
    if momento:
        query = query.filter(POP.momento == momento)

    pops = query.order_by(POP.frequencia, POP.setor, POP.momento, POP.ordem).all()
    resultado = []

    for pop in pops:
        if not _fluxo_aplicavel(pop, fluxo):
            continue

        dias = PERIODOS.get(pop.frequencia or "diario", 1)
        inicio_periodo = datetime.combine(hoje, datetime.min.time()) - timedelta(days=dias - 1)

        execucoes = db.query(ExecucaoPOP).filter(
            ExecucaoPOP.pop_id == pop.id,
            ExecucaoPOP.status == "concluido",
            ExecucaoPOP.realizado_em >= inicio_periodo,
        ).order_by(ExecucaoPOP.realizado_em.desc()).first()

        ultima_exec = db.query(ExecucaoPOP).filter(
            ExecucaoPOP.pop_id == pop.id,
        ).order_by(ExecucaoPOP.realizado_em.desc()).first()

        item = _serialize(pop)
        item["concluido_periodo"] = execucoes is not None
        item["ultima_execucao"] = ultima_exec.realizado_em.isoformat() if ultima_exec else None
        item["ultimo_status"] = ultima_exec.status if ultima_exec else None
        resultado.append(item)

    return resultado


@router.post("/{pop_id}/executar")
def executar_pop(
    pop_id: int,
    data: Optional[PopExecucao] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pop = db.query(POP).filter(POP.id == pop_id, POP.ativo == 1).first()
    if not pop:
        raise HTTPException(status_code=404, detail="POP não encontrado")

    payload = data or PopExecucao()
    execucao = ExecucaoPOP(
        pop_id=pop_id,
        realizado_por=payload.realizado_por or current_user.nome,
        status="concluido",
        observacao=payload.observacao,
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
