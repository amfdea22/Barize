from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    usuario_nome: Optional[str] = None
    acao: str
    entidade_tipo: Optional[str] = None
    entidade_id: Optional[int] = None
    descricao: Optional[str] = None
    estado_anterior: Optional[Any] = None
    estado_novo: Optional[Any] = None
    motivo: Optional[str] = None
    ip_origem: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
