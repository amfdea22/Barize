"""
BARIZE - Schemas de Pedido (KDS)
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class PedidoItem(BaseModel):
    nome: str
    quantidade: int = 1
    preco: float = 0.0
    observacao: Optional[str] = None


class PedidoCreate(BaseModel):
    mesa: Optional[str] = None
    cliente: Optional[str] = None
    itens: List[PedidoItem] = []
    observacao: Optional[str] = None


class PedidoUpdate(BaseModel):
    mesa: Optional[str] = None
    cliente: Optional[str] = None
    observacao: Optional[str] = None
    itens: Optional[List[PedidoItem]] = None
    tempo_preparo_estimado: Optional[int] = None


class PedidoUpdateStatus(BaseModel):
    status: str  # Novo | Preparando | Pronto | Entregue


class PedidoResponse(BaseModel):
    id: int
    mesa: Optional[str] = None
    cliente: Optional[str] = None
    status: str
    itens: list
    total: float
    observacao: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    iniciado_em: Optional[datetime] = None
    pronto_em: Optional[datetime] = None
    tempo_preparo_estimado: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
