"""add copos table

Revision ID: 0008
Revises: 0007
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'copos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(100), nullable=False),
        sa.Column('tipo', sa.String(50), nullable=True),
        sa.Column('capacidade_ml', sa.Integer(), nullable=True),
        sa.Column('estoque_atual', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estoque_minimo', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('custo_unitario', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nome'),
    )
    op.create_index('ix_copos_id', 'copos', ['id'])


def downgrade():
    op.drop_index('ix_copos_id', table_name='copos')
    op.drop_table('copos')
