from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


class ProdutoBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    preco_venda: float = Field(..., ge=0)
    codigo_barras: Optional[str] = None
    imagem: Optional[str] = Field(None, max_length=10)
    foto_url: Optional[str] = Field(None, max_length=500)


class ProdutoCreate(ProdutoBase):
    tempo_preparo: Optional[int] = None


class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    categoria: Optional[str] = None
    preco_venda: Optional[float] = None
    codigo_barras: Optional[str] = None
    imagem: Optional[str] = None
    foto_url: Optional[str] = None
    ativo: Optional[int] = None
    tempo_preparo: Optional[int] = None


class ReceitaItem(BaseModel):
    insumo_id: int
    quantidade_necessaria: float


class ProdutoComReceita(ProdutoCreate):
    receitas: List[ReceitaItem] = []


class ProdutoResponse(ProdutoBase):
    id: int
    ativo: int
    created_at: datetime
    updated_at: datetime
    modo_preparo: Optional[str] = None
    tipo_copo: Optional[str] = None
    guarnicao: Optional[str] = None
    tempo_preparo: Optional[int] = None
    dificuldade: Optional[str] = None
    teor_alcoolico: Optional[float] = None
    ingredientes: Optional[str] = None
    custo_total: Optional[float] = None
    preco_sugerido: Optional[float] = None
    foto_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProdutoDetail(ProdutoResponse):
    receitas: List[dict] = []

    model_config = ConfigDict(from_attributes=True)
