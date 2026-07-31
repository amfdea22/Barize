from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class AlertaConfigCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    tipo: str = Field(..., pattern=r"^(ESTOQUE_MINIMO|VENDA_ALTA|PERDA_EXCESSIVA)$")
    ativo: bool = True
    config_json: Optional[str] = None
    notificar_discord: bool = False
    notificar_telegram: bool = False
    notificar_slack: bool = False


class AlertaConfigUpdate(BaseModel):
    nome: Optional[str] = None
    ativo: Optional[bool] = None
    config_json: Optional[str] = None
    notificar_discord: Optional[bool] = None
    notificar_telegram: Optional[bool] = None
    notificar_slack: Optional[bool] = None


class AlertaConfigResponse(BaseModel):
    id: int
    nome: str
    tipo: str
    ativo: bool
    config_json: Optional[str] = None
    notificar_discord: bool
    notificar_telegram: bool
    notificar_slack: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
