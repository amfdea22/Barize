"""create producoes and itens_producao tables

Revision ID: 0015
Revises: 0014
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0015'
down_revision = '0014'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'producoes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('data_producao', sa.Date(), nullable=False),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.Column('custo_total', sa.Float(), server_default='0.0'),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_producoes_id', 'producoes', ['id'])

    op.create_table(
        'itens_producao',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('producao_id', sa.Integer(), nullable=False),
        sa.Column('produto_id', sa.Integer(), nullable=False),
        sa.Column('quantidade_produzida', sa.Integer(), server_default='1'),
        sa.Column('custo_unitario', sa.Float(), server_default='0.0'),
        sa.Column('custo_total', sa.Float(), server_default='0.0'),
        sa.ForeignKeyConstraint(['producao_id'], ['producoes.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['produto_id'], ['produtos.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_itens_producao_id', 'itens_producao', ['id'])
    op.create_index('ix_itens_producao_producao_id', 'itens_producao', ['producao_id'])


def downgrade():
    op.drop_index('ix_itens_producao_producao_id', table_name='itens_producao')
    op.drop_index('ix_itens_producao_id', table_name='itens_producao')
    op.drop_table('itens_producao')
    op.drop_index('ix_producoes_id', table_name='producoes')
    op.drop_table('producoes')
