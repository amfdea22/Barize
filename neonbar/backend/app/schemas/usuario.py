import re
from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


def validar_senha(senha: str) -> str:
    if len(senha) < 8:
        raise ValueError("Senha deve ter no minimo 8 caracteres")
    if not re.search(r"[A-Z]", senha):
        raise ValueError("Senha deve conter pelo menos uma letra maiuscula")
    if not re.search(r"[a-z]", senha):
        raise ValueError("Senha deve conter pelo menos uma letra minuscula")
    if not re.search(r"\d", senha):
        raise ValueError("Senha deve conter pelo menos um numero")
    return senha


class UsuarioCreate(BaseModel):
    nome: str = Field(..., min_length=3, max_length=200)
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    senha: str = Field(..., min_length=8)
    role: str = Field(default="bartender", pattern=r"^(bartender|gerente|admin)$")
    pin: Optional[str] = Field(None, min_length=4, max_length=6)

    _validar_senha = field_validator("senha")(validar_senha)


class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    ativo: Optional[int] = None
    pin: Optional[str] = None


class SenhaChange(BaseModel):
    senha_atual: str = Field(..., min_length=1)
    nova_senha: str = Field(..., min_length=8)

    _validar_nova_senha = field_validator("nova_senha")(validar_senha)


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    username: str
    role: str
    ativo: int
    created_at: datetime
    ultimo_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse
