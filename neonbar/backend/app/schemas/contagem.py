from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date


class ItemContagemBase(BaseModel):
    insumo_id: int
    quantidade_sistema: float = Field(default=0.0)
    quantidade_contada: float = Field(default=0.0)
    diferenca: float = Field(default=0.0)
    status: str = Field(default="pendente")
    observacao: Optional[str] = None


class ItemContagemCreate(BaseModel):
    insumo_id: int
    quantidade_sistema: float


class ItemContagemUpdate(BaseModel):
    quantidade_contada: float = Field(..., ge=0)
    observacao: Optional[str] = None


class ItemContagemResponse(ItemContagemBase):
    id: int
    contagem_id: int

    model_config = ConfigDict(from_attributes=True)


class ContagemBase(BaseModel):
    data_contagem: date
    observacao: Optional[str] = None


class ContagemCreate(ContagemBase):
    pass


class ContagemResponse(ContagemBase):
    id: int
    status: str
    created_by: Optional[str] = None
    aprovado_por: Optional[str] = None
    total_divergencias: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    itens: List[ItemContagemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ContagemRelatorio(ContagemBase):
    id: int
    status: str
    created_by: Optional[str] = None
    total_divergencias: int = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
