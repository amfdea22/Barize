"""create recebimentos and itens_recebimento tables

Revision ID: 0013
Revises: 0012
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0013'
down_revision = '0012'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'recebimentos',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('nota_fiscal', sa.String(50), nullable=True),
        sa.Column('fornecedor_nome', sa.String(200), nullable=True),
        sa.Column('data_recebimento', sa.Date(), nullable=False),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.Column('total_itens', sa.Integer(), server_default='0'),
        sa.Column('total_valor', sa.Float(), server_default='0.0'),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_recebimentos_id', 'recebimentos', ['id'])
    op.create_index('ix_recebimentos_data_recebimento', 'recebimentos', ['data_recebimento'])

    op.create_table(
        'itens_recebimento',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('recebimento_id', sa.Integer(), nullable=False),
        sa.Column('insumo_id', sa.Integer(), nullable=False),
        sa.Column('lote_id', sa.Integer(), nullable=True),
        sa.Column('quantidade', sa.Float(), nullable=False),
        sa.Column('custo_unitario', sa.Float(), server_default='0.0'),
        sa.Column('total', sa.Float(), server_default='0.0'),
        sa.Column('data_validade', sa.Date(), nullable=True),
        sa.ForeignKeyConstraint(['recebimento_id'], ['recebimentos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['insumo_id'], ['insumos.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['lote_id'], ['lotes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_itens_recebimento_id', 'itens_recebimento', ['id'])
    op.create_index('ix_itens_recebimento_recebimento_id', 'itens_recebimento', ['recebimento_id'])


def downgrade():
    op.drop_index('ix_itens_recebimento_recebimento_id', table_name='itens_recebimento')
    op.drop_index('ix_itens_recebimento_id', table_name='itens_recebimento')
    op.drop_table('itens_recebimento')
    op.drop_index('ix_recebimentos_data_recebimento', table_name='recebimentos')
    op.drop_index('ix_recebimentos_id', table_name='recebimentos')
    op.drop_table('recebimentos')
