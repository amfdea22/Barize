"""create lotes table

Revision ID: 0012
Revises: 0011
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0012'
down_revision = '0011'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'lotes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('insumo_id', sa.Integer(), nullable=False),
        sa.Column('codigo_lote', sa.String(100), nullable=False),
        sa.Column('data_fabricacao', sa.Date(), nullable=True),
        sa.Column('data_validade', sa.Date(), nullable=True),
        sa.Column('quantidade_inicial', sa.Float(), server_default='0'),
        sa.Column('quantidade_atual', sa.Float(), server_default='0'),
        sa.Column('custo_unitario', sa.Float(), server_default='0.0'),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['insumo_id'], ['insumos.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_lotes_id', 'lotes', ['id'])
    op.create_index('ix_lotes_insumo_id', 'lotes', ['insumo_id'])


def downgrade():
    op.drop_index('ix_lotes_insumo_id', table_name='lotes')
    op.drop_index('ix_lotes_id', table_name='lotes')
    op.drop_table('lotes')
