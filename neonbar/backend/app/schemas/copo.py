from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CopoBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    tipo: Optional[str] = None
    capacidade_ml: Optional[int] = None
    estoque_minimo: int = Field(default=0, ge=0)
    custo_unitario: float = Field(default=0.0, ge=0)


class CopoCreate(CopoBase):
    estoque_atual: int = Field(default=0, ge=0)


class CopoUpdate(BaseModel):
    nome: Optional[str] = None
    tipo: Optional[str] = None
    capacidade_ml: Optional[int] = None
    estoque_atual: Optional[int] = None
    estoque_minimo: Optional[int] = None
    custo_unitario: Optional[float] = None


class CopoResponse(CopoBase):
    id: int
    estoque_atual: int
    deleted_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
