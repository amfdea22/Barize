from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PagamentoCreate(BaseModel):
    venda_id: Optional[int] = None
    forma_pagamento: str
    valor: float
    valor_servico_pago: float = 0.0
    valor_couvert_pago: float = 0.0
    isencao_servico: bool = False
    isencao_couvert: bool = False
    motivo_isencao: Optional[str] = None

class PagamentoResponse(BaseModel):
    id: int
    venda_id: Optional[int] = None
    forma_pagamento: str
    valor: float
    valor_servico_pago: float = 0.0
    valor_couvert_pago: float = 0.0
    isencao_servico: bool = False
    isencao_couvert: bool = False
    motivo_isencao: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
