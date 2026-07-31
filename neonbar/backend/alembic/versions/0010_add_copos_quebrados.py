"""add copos_quebrados table

Revision ID: 0010
Revises: 0009
Create Date: 2026-07-17

"""
from alembic import op
import sqlalchemy as sa


revision = '0010'
down_revision = '0009'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'copos_quebrados',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('copo_id', sa.Integer(), nullable=False),
        sa.Column('quantidade', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('motivo', sa.Text(), nullable=True),
        sa.Column('valor_total', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('registrado_por', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['copo_id'], ['copos.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_copos_quebrados_id', 'copos_quebrados', ['id'])
    op.create_index('ix_copos_quebrados_copo_id', 'copos_quebrados', ['copo_id'])


def downgrade():
    op.drop_index('ix_copos_quebrados_copo_id', table_name='copos_quebrados')
    op.drop_index('ix_copos_quebrados_id', table_name='copos_quebrados')
    op.drop_table('copos_quebrados')
