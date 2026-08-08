"""
BARIZE - Schemas de Configuração de Impressora
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class FilaImpressaoItem(BaseModel):
    id: int
    tipo: str
    status: str
    impressora_destino: Optional[str] = None
    tentativas: int
    erro_msg: Optional[str] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class PrinterConfigBase(BaseModel):
    setor: str = "CAIXA"  # CAIXA | COZINHA | BAR
    tipo: str = "network"  # network | usb | serial
    host: Optional[str] = None
    porta: Optional[int] = 9100
    baud_rate: Optional[int] = 9600
    timeout: Optional[float] = 5.0
    ativo: bool = True


class PrinterConfigCreate(PrinterConfigBase):
    pass


class PrinterConfigUpdate(BaseModel):
    setor: Optional[str] = None
    tipo: Optional[str] = None
    host: Optional[str] = None
    porta: Optional[int] = None
    baud_rate: Optional[int] = None
    timeout: Optional[float] = None
    ativo: Optional[bool] = None


class PrinterConfigResponse(PrinterConfigBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PrinterTestRequest(BaseModel):
    tipo: str = "network"
    host: Optional[str] = None
    porta: Optional[int] = 9100
    baud_rate: Optional[int] = 9600
    timeout: Optional[float] = 5.0


class PrinterTestResponse(BaseModel):
    sucesso: bool
    mensagem: str


class PrinterStatusResponse(BaseModel):
    setor: str
    online: bool
    tampa_aberta: bool = False
    papel_esgotado: bool = False
    papel_baixo: bool = False
    erro_mecanico: bool = False
    recovery: bool = False
    offline_razao: Optional[str] = None
    mensagem: str = ""
