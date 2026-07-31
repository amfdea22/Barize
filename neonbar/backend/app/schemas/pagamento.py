from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class PagamentoCreate(BaseModel):
    venda_id: Optional[int] = None
    forma_pagamento: str
    valor: float

class PagamentoResponse(BaseModel):
    id: int
    venda_id: Optional[int] = None
    forma_pagamento: str
    valor: float
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
