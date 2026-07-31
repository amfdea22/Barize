"""add produto ficha tecnica fields

Revision ID: 0007
Revises: 0006
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('produtos', sa.Column('modo_preparo', sa.Text(), nullable=True))
    op.add_column('produtos', sa.Column('tipo_copo', sa.String(100), nullable=True))
    op.add_column('produtos', sa.Column('guarnicao', sa.String(200), nullable=True))
    op.add_column('produtos', sa.Column('tempo_preparo', sa.Integer(), nullable=True))
    op.add_column('produtos', sa.Column('dificuldade', sa.String(20), nullable=True))
    op.add_column('produtos', sa.Column('teor_alcoolico', sa.Float(), nullable=True))
    op.add_column('produtos', sa.Column('custo_total', sa.Float(), nullable=True))
    op.add_column('produtos', sa.Column('preco_sugerido', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('produtos', 'preco_sugerido')
    op.drop_column('produtos', 'custo_total')
    op.drop_column('produtos', 'teor_alcoolico')
    op.drop_column('produtos', 'dificuldade')
    op.drop_column('produtos', 'tempo_preparo')
    op.drop_column('produtos', 'guarnicao')
    op.drop_column('produtos', 'tipo_copo')
    op.drop_column('produtos', 'modo_preparo')
