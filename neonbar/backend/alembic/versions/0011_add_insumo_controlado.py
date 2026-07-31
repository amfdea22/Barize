"""add controlado, codigo_barras, validade_dias to insumos

Revision ID: 0011
Revises: 0010
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0011'
down_revision = '0010'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('insumos', sa.Column('controlado', sa.Integer(), server_default='0'))
    op.add_column('insumos', sa.Column('codigo_barras', sa.String(50), nullable=True))
    op.add_column('insumos', sa.Column('validade_dias', sa.Integer(), nullable=True))
    op.create_unique_constraint('uq_insumos_codigo_barras', 'insumos', ['codigo_barras'])


def downgrade():
    op.drop_constraint('uq_insumos_codigo_barras', 'insumos')
    op.drop_column('insumos', 'validade_dias')
    op.drop_column('insumos', 'codigo_barras')
    op.drop_column('insumos', 'controlado')
