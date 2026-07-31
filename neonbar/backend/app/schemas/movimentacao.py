from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class MovimentacaoBase(BaseModel):
    insumo_id: int
    tipo: str = Field(..., pattern=r"^(COMPRA|VENDA|AJUSTE|PERDA)$")
    quantidade: float  # Positiva para entrada, negativa para saída
    observacao: Optional[str] = None
    documento_referencia: Optional[str] = None


class MovimentacaoCreate(MovimentacaoBase):
    custo_no_momento: float = Field(default=0.0, ge=0)
    produto_id: Optional[int] = None


class MovimentacaoResponse(MovimentacaoBase):
    id: int
    custo_no_momento: float
    produto_id: Optional[int] = None
    usuario_id: Optional[int] = None
    data: datetime

    model_config = ConfigDict(from_attributes=True)
