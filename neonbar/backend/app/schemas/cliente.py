from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class ClienteCreate(BaseModel):
    nome: str
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_nascimento: Optional[str] = None
    acumulado_gastos: Optional[float] = 0.0
    observacao: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_nascimento: Optional[str] = None
    acumulado_gastos: Optional[float] = None
    observacao: Optional[str] = None
    ativo: Optional[bool] = None


class ClienteResponse(BaseModel):
    id: int
    nome: str
    cpf_cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    data_nascimento: Optional[str] = None
    acumulado_gastos: Optional[float] = None
    observacao: Optional[str] = None
    ativo: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
