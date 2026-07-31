from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date


class ItemProducaoBase(BaseModel):
    produto_id: int
    quantidade_produzida: int = Field(default=1, ge=1)


class ItemProducaoCreate(ItemProducaoBase):
    pass


class ItemProducaoResponse(ItemProducaoBase):
    id: int
    producao_id: int
    custo_unitario: float
    custo_total: float

    model_config = ConfigDict(from_attributes=True)


class ProducaoBase(BaseModel):
    data_producao: date
    observacao: Optional[str] = None


class ProducaoCreate(ProducaoBase):
    itens: List[ItemProducaoCreate] = Field(..., min_length=1)


class ProducaoResponse(ProducaoBase):
    id: int
    custo_total: float
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    itens: List[ItemProducaoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProducaoRelatorio(ProducaoBase):
    id: int
    custo_total: float
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
