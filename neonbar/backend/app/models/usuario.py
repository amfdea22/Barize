"""
BARIZE - Modelo de Usuário com RBAC
Pilar 5: Segurança e Auditoria - Controle de Acesso (RBAC) + Criptografia
Usa bcrypt diretamente (compatível com Python 3.14 e bcrypt>=5.0)
"""

from sqlalchemy import Column, Integer, String, DateTime, func
from ..database import Base
import bcrypt as _bcrypt


class Usuario(Base):
    """
    Usuário do sistema BARIZE com níveis de permissão.
    Níveis (Role): bartender, gerente, admin
    """
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False, unique=True, index=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    senha_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="bartender")  # bartender, gerente, admin
    ativo = Column(Integer, nullable=False, default=1)
    pin = Column(String(6), nullable=True)  # PIN rápido para PDV

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    ultimo_login = Column(DateTime, nullable=True)

    def set_senha(self, senha: str):
        """Criptografa a senha usando bcrypt diretamente."""
        salt = _bcrypt.gensalt(rounds=12)
        self.senha_hash = _bcrypt.hashpw(
            senha.encode("utf-8"), salt
        ).decode("utf-8")

    def verificar_senha(self, senha: str) -> bool:
        """Verifica a senha contra o hash armazenado."""
        return _bcrypt.checkpw(
            senha.encode("utf-8"),
            self.senha_hash.encode("utf-8"),
        )

    def __repr__(self):
        return f"<Usuario(id={self.id}, username='{self.username}', role='{self.role}')>"
