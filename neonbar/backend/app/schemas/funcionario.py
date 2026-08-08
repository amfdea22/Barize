from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import date
from typing import Literal

CargoTipo = Literal["bartender", "garcom", "caixa", "estoquista", "cozinheiro", "auxiliar_cozinha", "gerente_operacional", "outro"]
TipoContrato = Literal["CLT", "PJ", "estagiario", "menor_aprendiz"]
TurnoTipo = Literal["manha", "tarde", "noite", "misto"]


class FuncionarioBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    cpf: str = Field(..., min_length=11, max_length=14)
    rg: Optional[str] = Field(None, max_length=20)
    data_nascimento: Optional[date] = None
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=200)
    endereco: Optional[str] = None

    cargo: CargoTipo
    data_admissao: date
    data_demissao: Optional[date] = None
    motivo_demissao: Optional[str] = None
    salario_hora: Optional[float] = Field(None, ge=0)
    tipo_contrato: TipoContrato = "CLT"

    turno: Optional[TurnoTipo] = None
    dias_semana: Optional[List[int]] = None
    carga_horaria_semanal: Optional[float] = Field(None, ge=0, le=80)

    observacoes: Optional[str] = None

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        # Remove formatação
        cpf = "".join(filter(str.isdigit, v))
        if len(cpf) != 11:
            raise ValueError("CPF deve ter 11 dígitos")
        # Validação básica de CPF (dígitos verificadores)
        if cpf == cpf[0] * 11:
            raise ValueError("CPF inválido")
        # Calcula primeiro dígito
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        digito1 = (soma * 10) % 11
        if digito1 == 10:
            digito1 = 0
        if digito1 != int(cpf[9]):
            raise ValueError("CPF inválido")
        # Calcula segundo dígito
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        digito2 = (soma * 10) % 11
        if digito2 == 10:
            digito2 = 0
        if digito2 != int(cpf[10]):
            raise ValueError("CPF inválido")
        return cpf

    @field_validator("dias_semana")
    @classmethod
    def validar_dias_semana(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is None:
            return v
        for d in v:
            if not 1 <= d <= 7:
                raise ValueError("Dias da semana devem ser entre 1 (segunda) e 7 (domingo)")
        return v


class FuncionarioCreate(FuncionarioBase):
    usuario_id: Optional[int] = None


class FuncionarioUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=1, max_length=200)
    cpf: Optional[str] = Field(None, min_length=11, max_length=14)
    rg: Optional[str] = Field(None, max_length=20)
    data_nascimento: Optional[date] = None
    telefone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=200)
    endereco: Optional[str] = None

    cargo: Optional[CargoTipo] = None
    data_admissao: Optional[date] = None
    data_demissao: Optional[date] = None
    motivo_demissao: Optional[str] = None
    salario_hora: Optional[float] = Field(None, ge=0)
    tipo_contrato: Optional[TipoContrato] = None

    turno: Optional[TurnoTipo] = None
    dias_semana: Optional[List[int]] = None
    carga_horaria_semanal: Optional[float] = Field(None, ge=0, le=80)

    ativo: Optional[int] = None
    observacoes: Optional[str] = None

    @field_validator("cpf")
    @classmethod
    def validar_cpf_update(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        cpf = "".join(filter(str.isdigit, v))
        if len(cpf) != 11:
            raise ValueError("CPF deve ter 11 dígitos")
        if cpf == cpf[0] * 11:
            raise ValueError("CPF inválido")
        soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
        digito1 = (soma * 10) % 11
        if digito1 == 10:
            digito1 = 0
        if digito1 != int(cpf[9]):
            raise ValueError("CPF inválido")
        soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
        digito2 = (soma * 10) % 11
        if digito2 == 10:
            digito2 = 0
        if digito2 != int(cpf[10]):
            raise ValueError("CPF inválido")
        return cpf

    @field_validator("dias_semana")
    @classmethod
    def validar_dias_semana_update(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        if v is None:
            return v
        for d in v:
            if not 1 <= d <= 7:
                raise ValueError("Dias da semana devem ser entre 1 (segunda) e 7 (domingo)")
        return v


class FuncionarioResponse(FuncionarioBase):
    id: int
    usuario_id: Optional[int] = None
    ativo: int
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class FuncionarioListItem(BaseModel):
    id: int
    nome: str
    cpf: str
    cargo: str
    turno: Optional[str] = None
    data_admissao: date
    ativo: int

    model_config = ConfigDict(from_attributes=True)


class FuncionarioVincularUsuario(BaseModel):
    usuario_id: int