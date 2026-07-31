"""
BARIZE - Rotas de Autenticação
Pilar 5: Segurança e Auditoria - RBAC + JWT
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..schemas.usuario import (
    UsuarioCreate, UsuarioResponse, LoginRequest, TokenResponse, UsuarioUpdate, SenhaChange,
)
from ..services.auth_service import (
    criar_token, get_current_user, verificar_role, hash_senha,
)
from ..services.audit_service import AuditService
from ..dependencies import limiter

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """Autentica usuário e retorna JWT token."""
    usuario = db.query(Usuario).filter(
        Usuario.username == data.username,
        Usuario.ativo == 1,
    ).first()

    if not usuario or not usuario.verificar_senha(data.senha):
        logger.warning(f"[AUTH] Tentativa de login inválida: {data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
        )

    # Atualiza último login
    usuario.ultimo_login = datetime.now(timezone.utc)
    db.commit()

    token = criar_token(usuario)
    logger.info(f"[AUTH] Login: {usuario.username} ({usuario.role})")

    return TokenResponse(
        access_token=token,
        usuario=UsuarioResponse.model_validate(usuario),
    )


@router.post("/usuarios", response_model=UsuarioResponse)
@limiter.limit("10/minute")
def criar_usuario(
    request: Request,
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria novo usuário (apenas admin)."""
    verificar_role(current_user, ["admin"])

    # Verifica se já existe
    if db.query(Usuario).filter(
        (Usuario.username == data.username) | (Usuario.email == data.email)
    ).first():
        raise HTTPException(status_code=400, detail="Username ou email já existe")

    usuario = Usuario(
        nome=data.nome,
        email=data.email,
        username=data.username,
        role=data.role,
        pin=data.pin,
    )
    usuario.set_senha(data.senha)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    AuditService.registrar(
        db=db,
        acao="USUARIO_CRIADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Usuario",
        entidade_id=usuario.id,
        descricao=f"Usuário '{usuario.username}' criado com role '{usuario.role}'",
        estado_novo={"username": usuario.username, "role": usuario.role},
    )

    return UsuarioResponse.model_validate(usuario)


@router.get("/usuarios", response_model=list[UsuarioResponse])
def listar_usuarios(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os usuários (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    usuarios = db.query(Usuario).offset(offset).limit(limit).all()
    return [UsuarioResponse.model_validate(u) for u in usuarios]


@router.get("/me", response_model=UsuarioResponse)
def me(
    current_user: Usuario = Depends(get_current_user),
):
    """Retorna dados do usuário logado."""
    return UsuarioResponse.model_validate(current_user)


@router.put("/usuarios/{usuario_id}", response_model=UsuarioResponse)
def atualizar_usuario(
    usuario_id: int,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza dados de um usuário (admin)."""
    verificar_role(current_user, ["admin"])

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if data.nome is not None:
        usuario.nome = data.nome
    if data.email is not None:
        usuario.email = data.email
    if data.role is not None:
        usuario.role = data.role
    if data.ativo is not None:
        usuario.ativo = data.ativo
    if data.pin is not None:
        usuario.pin = data.pin

    db.commit()
    db.refresh(usuario)
    return UsuarioResponse.model_validate(usuario)


@router.post("/alterar-senha")
def alterar_senha(
    data: SenhaChange,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Permite que o usuario logado altere sua propria senha."""
    if not current_user.verificar_senha(data.senha_atual):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha atual incorreta",
        )

    current_user.set_senha(data.nova_senha)
    db.commit()

    AuditService.registrar(
        db=db,
        acao="SENHA_ALTERADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Usuario",
        entidade_id=current_user.id,
        descricao=f"Senha alterada pelo usuario '{current_user.username}'",
    )

    logger.info(f"[AUTH] Senha alterada: {current_user.username}")
    return {"sucesso": True, "mensagem": "Senha alterada com sucesso"}
