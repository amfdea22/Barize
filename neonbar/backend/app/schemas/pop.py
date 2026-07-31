from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from typing import Literal

FrequenciaTipo = Literal["diario", "semanal", "mensal"]
MomentoTipo = Literal["abertura", "durante", "fechamento"]
FluxoTipo = Literal["baixo", "medio", "alto"]


class PopBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    passos: List[dict] = []
    frequencia: FrequenciaTipo = "diario"
    momento: Optional[MomentoTipo] = None
    exigencia_fluxo: Optional[dict] = None
    setor: Optional[str] = None
    ordem: Optional[int] = 0


class PopCreate(PopBase):
    pass


class PopUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    passos: Optional[List[dict]] = None
    frequencia: Optional[FrequenciaTipo] = None
    momento: Optional[MomentoTipo] = None
    exigencia_fluxo: Optional[dict] = None
    setor: Optional[str] = None
    ordem: Optional[int] = None
    ativo: Optional[int] = None


class PopResponse(PopBase):
    id: int
    ativo: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PopPendente(PopResponse):
    concluido_periodo: bool = False
    ultima_execucao: Optional[str] = None
    ultimo_status: Optional[str] = None


class PopExecucao(BaseModel):
    realizado_por: Optional[str] = None
    observacao: Optional[str] = None
