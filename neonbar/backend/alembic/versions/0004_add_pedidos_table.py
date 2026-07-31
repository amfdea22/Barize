"""add pedidos table

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-16

"""
from alembic import op
import sqlalchemy as sa


revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'pedidos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('mesa', sa.String(length=20), nullable=True),
        sa.Column('cliente', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('itens', sa.JSON(), nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('observacao', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_pedidos_id', 'pedidos', ['id'])
    op.create_index('ix_pedidos_status', 'pedidos', ['status'])


def downgrade():
    op.drop_index('ix_pedidos_status', table_name='pedidos')
    op.drop_index('ix_pedidos_id', table_name='pedidos')
    op.drop_table('pedidos')
