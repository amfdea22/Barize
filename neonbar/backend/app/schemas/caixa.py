from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict
from datetime import datetime


class CaixaCreate(BaseModel):
    usuario_id: int
    saldo_inicial: float = Field(default=0.0, ge=0)


class CaixaResponse(BaseModel):
    id: int
    usuario_id: int
    status: str
    saldo_inicial: float
    saldo_final_esperado: Optional[float] = None
    saldo_final_declarado: Optional[float] = None
    diferenca: Optional[float] = None
    valores_declarados: Optional[Dict] = None
    data_abertura: datetime
    data_fechamento: Optional[datetime] = None
    observacao: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FechamentoCreate(BaseModel):
    valores_declarados: Dict[str, float]
    # Ex: {"dinheiro": 1500.00, "cartao_credito": 3200.00, "cartao_debito": 1800.00, "pix": 2500.00}
    observacao: Optional[str] = None


class FechamentoResponse(BaseModel):
    caixa_id: int
    forma_pagamento: str
    valor_sistema: float
    valor_declarado: float
    diferenca: float

    model_config = ConfigDict(from_attributes=True)
