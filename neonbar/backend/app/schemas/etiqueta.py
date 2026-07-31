from pydantic import BaseModel
from typing import Optional, Literal
from datetime import date


class EtiquetaItem(BaseModel):
    tipo: Literal["insumo", "produto"]
    item_id: int
    nome: str
    categoria: Optional[str] = None
    codigo_lote: str
    data_validade: Optional[date] = None
    data_fabricacao: Optional[date] = None
    quantidade: float
    unidade_medida: Optional[str] = None
    codigo_barras: Optional[str] = None
    dias_para_vencer: Optional[int] = None
