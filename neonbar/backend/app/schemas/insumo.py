from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class InsumoBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    unidade_medida: str = Field(default="un", max_length=20)
    estoque_minimo: float = Field(default=0.0, ge=0)
    custo_unitario: float = Field(default=0.0, ge=0)
    controlado: int = Field(default=0, ge=0, le=1)
    codigo_barras: Optional[str] = None
    validade_dias: Optional[int] = None


class InsumoCreate(InsumoBase):
    estoque_atual: float = Field(default=0.0, ge=0)


class InsumoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    unidade_medida: Optional[str] = None
    estoque_atual: Optional[float] = None
    estoque_minimo: Optional[float] = None
    custo_unitario: Optional[float] = None
    ativo: Optional[int] = None
    controlado: Optional[int] = None
    codigo_barras: Optional[str] = None
    validade_dias: Optional[int] = None


class InsumoResponse(InsumoBase):
    id: int
    estoque_atual: float
    ativo: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
