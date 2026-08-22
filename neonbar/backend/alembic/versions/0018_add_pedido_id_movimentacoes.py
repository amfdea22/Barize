"""add pedido_id to movimentacoes (link stock movements to orders for cancellation rollback)

Revision ID: 0018
Revises: 0017
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa


revision = '0018'
down_revision = '0017'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('movimentacoes', sa.Column('pedido_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_movimentacoes_pedido', 'movimentacoes', 'pedidos', ['pedido_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_movimentacoes_pedido_id', 'movimentacoes', ['pedido_id'])


def downgrade():
    op.drop_index('ix_movimentacoes_pedido_id', 'movimentacoes')
    op.drop_constraint('fk_movimentacoes_pedido', 'movimentacoes', type_='foreignkey')
    op.drop_column('movimentacoes', 'pedido_id')
