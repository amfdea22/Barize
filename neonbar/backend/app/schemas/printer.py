"""
BARIZE - Schemas de Configuração de Impressora
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional


class PrinterConfigBase(BaseModel):
    tipo: str = "network"  # network | usb | serial
    host: Optional[str] = None
    porta: Optional[int] = 9100
    baud_rate: Optional[int] = 9600
    timeout: Optional[float] = 5.0
    ativo: bool = True


class PrinterConfigCreate(PrinterConfigBase):
    pass


class PrinterConfigUpdate(BaseModel):
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
