"""add pagamentos table

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'pagamentos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('venda_id', sa.Integer(), nullable=True),
        sa.Column('forma_pagamento', sa.String(length=30), nullable=False),
        sa.Column('valor', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_pagamentos_id', 'pagamentos', ['id'])
    op.create_index('ix_pagamentos_venda_id', 'pagamentos', ['venda_id'])


def downgrade():
    op.drop_index('ix_pagamentos_venda_id', table_name='pagamentos')
    op.drop_index('ix_pagamentos_id', table_name='pagamentos')
    op.drop_table('pagamentos')
