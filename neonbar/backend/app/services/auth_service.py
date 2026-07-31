"""
BARIZE - Serviço de Autenticação e Autorização (RBAC)
Pilar 5: Segurança e Auditoria - Controle de Acesso + Criptografia
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
from loguru import logger

from ..config import get_settings
from ..database import get_db
from ..models.usuario import Usuario

settings = get_settings()
security = HTTPBearer()


def criar_token(usuario: Usuario) -> str:
    """Gera JWT token para o usuário."""
    payload = {
        "sub": str(usuario.id),
        "username": usuario.username,
        "role": usuario.role,
        "nome": usuario.nome,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verificar_token(token: str) -> dict:
    """Decodifica e verifica o JWT token."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    """Extrai e valida o usuário atual do token JWT."""
    payload = verificar_token(credentials.credentials)
    usuario_id = int(payload.get("sub"))

    usuario = db.query(Usuario).filter(
        Usuario.id == usuario_id,
        Usuario.ativo == 1,
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou inativo",
        )

    return usuario


def verificar_role(usuario: Usuario, roles_permitidas: list) -> bool:
    """Verifica se o usuário tem uma das roles permitidas."""
    if usuario.role not in roles_permitidas:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acesso negado. Role '{usuario.role}' não autorizada. Necessário: {roles_permitidas}",
        )
    return True


def requer_role(*roles: str):
    """Decorator-like factory para verificação de role via dependência."""
    async def _verificador(usuario: Usuario = Depends(get_current_user)):
        verificar_role(usuario, list(roles))
        return usuario
    return _verificador


# Utilitário para hashing de senha
def hash_senha(senha: str) -> str:
    import bcrypt as _bcrypt
    salt = _bcrypt.gensalt()
    return _bcrypt.hashpw(senha.encode("utf-8"), salt).decode("utf-8")


def verificar_senha(senha: str, senha_hash: str) -> bool:
    import bcrypt as _bcrypt
    return _bcrypt.checkpw(
        senha.encode("utf-8"),
        senha_hash.encode("utf-8"),
    )
