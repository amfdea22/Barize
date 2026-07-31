"""
BARIZE - Dependency Injection
Define dependências reutilizáveis para os routers.
"""

from fastapi import Depends
from sqlalchemy.orm import Session
from typing import Annotated
from slowapi import Limiter
from slowapi.util import get_remote_address

from .database import get_db
from .models.usuario import Usuario
from .services.auth_service import get_current_user, verificar_role

# ─── Rate Limiter Compartilhado ──────────────────────────
limiter = Limiter(key_func=get_remote_address)

# Type aliases para facilitar injeção
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[Usuario, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> Usuario:
    """Dependência que exige role admin."""
    verificar_role(user, ["admin"])
    return user


def require_gerente(user: CurrentUser) -> Usuario:
    """Dependência que exige role gerente ou admin."""
    verificar_role(user, ["admin", "gerente"])
    return user


AdminUser = Annotated[Usuario, Depends(require_admin)]
GerenteUser = Annotated[Usuario, Depends(require_gerente)]
