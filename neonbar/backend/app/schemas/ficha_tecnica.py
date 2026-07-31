from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import date


class PreparoItem(BaseModel):
    ordem: int
    descricao: str
    tempo_segundos: Optional[int] = None
    tecnica: Optional[str] = None  # ex: "shake", "stir", "build", "muddle", "strain"
    observacao: Optional[str] = None


class ArmazenamentoItem(BaseModel):
    tipo: str  # "geladeira", "freezer", "temperatura_ambiente", "adega"
    temperatura_min: Optional[float] = None
    temperatura_max: Optional[float] = None
    tempo_maximo_dias: Optional[int] = None
    observacao: Optional[str] = None


class HarmonizacaoItem(BaseModel):
    descricao: str
    tipo: Optional[str] = None  # "entrada", "prato_principal", "sobremesa", "petisco"


class FichaTecnicaItem(BaseModel):
    produto_id: int
    nome: str
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    preco_venda: float
    codigo_barras: Optional[str] = None
    foto_url: Optional[str] = None
    imagem: Optional[str] = None
    teor_alcoolico: Optional[float] = None
    dificuldade: Optional[str] = None  # "facil", "medio", "dificil"
    custo_total: Optional[float] = None
    margem_lucro: Optional[float] = None

    # Ingredientes (da receita)
    ingredientes: List[dict] = []  # {insumo_id, nome, quantidade, unidade_medida, custo_unitario}

    # Preparo
    preparo: List[PreparoItem] = []

    # Armazenamento
    armazenamento: List[ArmazenamentoItem] = []

    # Harmonização
    harmonizacao: List[HarmonizacaoItem] = []

    # Informações nutricionais (estimadas)
    calorias_estimadas: Optional[float] = None
    carboidratos_g: Optional[float] = None
    proteinas_g: Optional[float] = None
    gorduras_g: Optional[float] = None

    # Filtros inteligentes
    tags: List[str] = []  # "sem_gluten", "vegano", "baixo_calorico", "classico", "signature"
    alergenos: List[str] = []  # "gluten", "lactose", "soja", "nozes", "crustaceos"

    # Metadados
    criado_em: Optional[str] = None
    atualizado_em: Optional[str] = None
    versao: int = 1


class FichaTecnicaFilter(BaseModel):
    categoria: Optional[str] = None
    tag: Optional[str] = None
    alergeno_excluir: Optional[str] = None
    dificuldade: Optional[str] = None
    teor_alcoolico_max: Optional[float] = None
    preco_max: Optional[float] = None
    apenas_ativos: bool = True


class FichaTecnicaResponse(FichaTecnicaItem):
    model_config = ConfigDict(from_attributes=True)