from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class MaterialBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    categoria: Optional[str] = None
    estoque_minimo: int = Field(default=0, ge=0)
    custo_unitario: float = Field(default=0.0, ge=0)


class MaterialCreate(MaterialBase):
    estoque_atual: int = Field(default=0, ge=0)


class MaterialUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    estoque_atual: Optional[int] = None
    estoque_minimo: Optional[int] = None
    custo_unitario: Optional[float] = None


class MaterialResponse(MaterialBase):
    id: int
    estoque_atual: int
    deleted_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
