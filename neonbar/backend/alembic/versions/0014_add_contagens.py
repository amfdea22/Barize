"""create contagens and itens_contagem tables

Revision ID: 0014
Revises: 0013
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0014'
down_revision = '0013'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'contagens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('data_contagem', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), server_default='em_andamento'),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('aprovado_por', sa.String(50), nullable=True),
        sa.Column('total_divergencias', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_contagens_id', 'contagens', ['id'])

    op.create_table(
        'itens_contagem',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('contagem_id', sa.Integer(), nullable=False),
        sa.Column('insumo_id', sa.Integer(), nullable=False),
        sa.Column('quantidade_sistema', sa.Float(), server_default='0.0'),
        sa.Column('quantidade_contada', sa.Float(), server_default='0.0'),
        sa.Column('diferenca', sa.Float(), server_default='0.0'),
        sa.Column('status', sa.String(20), server_default='pendente'),
        sa.Column('observacao', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['contagem_id'], ['contagens.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['insumo_id'], ['insumos.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_itens_contagem_id', 'itens_contagem', ['id'])
    op.create_index('ix_itens_contagem_contagem_id', 'itens_contagem', ['contagem_id'])


def downgrade():
    op.drop_index('ix_itens_contagem_contagem_id', table_name='itens_contagem')
    op.drop_index('ix_itens_contagem_id', table_name='itens_contagem')
    op.drop_table('itens_contagem')
    op.drop_index('ix_contagens_id', table_name='contagens')
    op.drop_table('contagens')
