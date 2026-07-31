from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class CopoQuebradoCreate(BaseModel):
    copo_id: int
    quantidade: int = Field(default=1, ge=1)
    motivo: Optional[str] = None


class CopoQuebradoResponse(BaseModel):
    id: int
    copo_id: int
    quantidade: int
    motivo: Optional[str] = None
    valor_total: float
    registrado_por: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CopoQuebradoResumo(BaseModel):
    total_hoje: int = 0
    total_semana: int = 0
    total_mes: int = 0
    total_quebras: int = 0
    custo_total: float = 0.0
