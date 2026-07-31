from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date


class ItemRecebimentoBase(BaseModel):
    insumo_id: int
    quantidade: float = Field(..., gt=0)
    custo_unitario: float = Field(default=0.0, ge=0)
    data_validade: Optional[date] = None
    lote_codigo: Optional[str] = None


class ItemRecebimentoCreate(ItemRecebimentoBase):
    pass


class ItemRecebimentoResponse(BaseModel):
    id: int
    recebimento_id: int
    insumo_id: int
    lote_id: Optional[int] = None
    quantidade: float
    custo_unitario: float
    total: float
    data_validade: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class RecebimentoBase(BaseModel):
    nota_fiscal: Optional[str] = None
    fornecedor_nome: Optional[str] = None
    data_recebimento: date
    observacao: Optional[str] = None


class RecebimentoCreate(RecebimentoBase):
    itens: List[ItemRecebimentoCreate] = Field(..., min_length=1)


class RecebimentoResponse(RecebimentoBase):
    id: int
    total_itens: int
    total_valor: float
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    itens: List[ItemRecebimentoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RecebimentoRelatorio(RecebimentoBase):
    id: int
    total_itens: int
    total_valor: float
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
