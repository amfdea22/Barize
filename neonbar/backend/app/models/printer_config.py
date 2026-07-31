"""
BARIZE - Modelo de Configuração de Impressora
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from ..database import Base


class PrinterConfig(Base):
    __tablename__ = "printer_config"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tipo = Column(String(20), default="network", nullable=False)  # network | usb | serial
    host = Column(String(255), nullable=True)
    porta = Column(Integer, default=9100, nullable=True)
    baud_rate = Column(Integer, default=9600, nullable=True)
    timeout = Column(Float, default=5.0, nullable=True)
    ativo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
