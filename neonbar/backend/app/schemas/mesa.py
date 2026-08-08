from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class MesaBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=20)
    local: Optional[str] = Field(None, max_length=50)


class MesaCreate(MesaBase):
    pass


class MesaUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=20)
    local: Optional[str] = Field(None, max_length=50)
    ativo: Optional[int] = None


class MesaResponse(MesaBase):
    id: int
    ativo: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
