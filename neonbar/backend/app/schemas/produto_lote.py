from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, date


class ProdutoLoteBase(BaseModel):
    produto_id: int
    codigo_lote: str = Field(..., min_length=1, max_length=100)
    data_fabricacao: Optional[date] = None
    data_validade: Optional[date] = None
    quantidade: float = Field(default=0, ge=0)


class ProdutoLoteCreate(ProdutoLoteBase):
    pass


class ProdutoLoteUpdate(BaseModel):
    codigo_lote: Optional[str] = None
    data_fabricacao: Optional[date] = None
    data_validade: Optional[date] = None
    quantidade: Optional[float] = None


class ProdutoResponse(BaseModel):
    id: int
    nome: str
    categoria: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProdutoLoteResponse(ProdutoLoteBase):
    id: int
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    produto: Optional[ProdutoResponse] = None

    model_config = ConfigDict(from_attributes=True)
