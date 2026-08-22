"""add tipo_pedido to pedidos (consumo/delivery/levar/retirada)

Revision ID: 0019
Revises: 0018
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa


revision = '0019'
down_revision = '0018'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('pedidos', sa.Column('tipo_pedido', sa.String(20), server_default='consumo', nullable=False))


def downgrade():
    op.drop_column('pedidos', 'tipo_pedido')
