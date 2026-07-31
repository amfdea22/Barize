"""add materiais table

Revision ID: 0009
Revises: 0008
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0009'
down_revision = '0008'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'materiais',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nome', sa.String(100), nullable=False),
        sa.Column('categoria', sa.String(50), nullable=True),
        sa.Column('estoque_atual', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estoque_minimo', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('custo_unitario', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nome'),
    )
    op.create_index('ix_materiais_id', 'materiais', ['id'])


def downgrade():
    op.drop_index('ix_materiais_id', table_name='materiais')
    op.drop_table('materiais')
