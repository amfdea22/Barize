from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date


class LoteBase(BaseModel):
    insumo_id: int
    codigo_lote: str = Field(..., min_length=1, max_length=100)
    data_fabricacao: Optional[date] = None
    data_validade: Optional[date] = None
    quantidade_inicial: float = Field(default=0.0, ge=0)
    quantidade_atual: float = Field(default=0.0, ge=0)
    custo_unitario: float = Field(default=0.0, ge=0)


class LoteCreate(LoteBase):
    pass


class LoteUpdate(BaseModel):
    codigo_lote: Optional[str] = None
    data_fabricacao: Optional[date] = None
    data_validade: Optional[date] = None
    quantidade_atual: Optional[float] = None
    custo_unitario: Optional[float] = None


class LoteResponse(LoteBase):
    id: int
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
