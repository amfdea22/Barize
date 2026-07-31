"""add clientes table

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'clientes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(length=150), nullable=False),
        sa.Column('cpf_cnpj', sa.String(length=20), nullable=True),
        sa.Column('telefone', sa.String(length=20), nullable=True),
        sa.Column('email', sa.String(length=150), nullable=True),
        sa.Column('data_nascimento', sa.String(length=10), nullable=True),
        sa.Column('acumulado_gastos', sa.Float(), default=0.0),
        sa.Column('observacao', sa.String(length=500), nullable=True),
        sa.Column('ativo', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cpf_cnpj'),
    )
    op.create_index('ix_clientes_id', 'clientes', ['id'])
    op.create_index('ix_clientes_cpf_cnpj', 'clientes', ['cpf_cnpj'])


def downgrade():
    op.drop_index('ix_clientes_cpf_cnpj', table_name='clientes')
    op.drop_index('ix_clientes_id', table_name='clientes')
    op.drop_table('clientes')
