"""
BARIZE - Modelo de Funcionário (RH)
Dados operacionais separados do usuário de autenticação.
"""

from sqlalchemy import Column, Integer, String, DateTime, func, Date, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class Funcionario(Base):
    """
    Funcionário operacional do bar/restaurante.
    Separado do Usuario (auth) para isolar dados de RH (LGPD, folha, comissão).
    """
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), unique=True, nullable=True)

    # Dados pessoais
    nome = Column(String(200), nullable=False, index=True)
    cpf = Column(String(14), unique=True, nullable=False, index=True)  # 000.000.000-00
    rg = Column(String(20), nullable=True)
    data_nascimento = Column(Date, nullable=True)
    telefone = Column(String(20), nullable=True)
    email = Column(String(200), nullable=True)
    endereco = Column(Text, nullable=True)

    # Dados profissionais
    cargo = Column(String(50), nullable=False, index=True)  # bartender, garcom, caixa, estoquista, cozinheiro, auxiliar_cozinha, gerente_operacional, outro
    data_admissao = Column(Date, nullable=False)
    data_demissao = Column(Date, nullable=True)
    motivo_demissao = Column(Text, nullable=True)
    salario_hora = Column(Float, nullable=True)
    tipo_contrato = Column(String(20), nullable=False, default="CLT")  # CLT, PJ, estagiario, menor_aprendiz

    # Escala/turno
    turno = Column(String(20), nullable=True)  # manha, tarde, noite, misto
    dias_semana = Column(JSON, nullable=True)  # [1,2,3,4,5] = seg-sex
    carga_horaria_semanal = Column(Float, nullable=True)

    # Status
    ativo = Column(Integer, nullable=False, default=1, index=True)
    observacoes = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relacionamentos
    usuario = relationship("Usuario", back_populates="funcionario", uselist=False)

    def __repr__(self):
        return f"<Funcionario(id={self.id}, nome='{self.nome}', cargo='{self.cargo}')>"