"""add printer_config table

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-16

"""
from alembic import op
import sqlalchemy as sa


revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'printer_config',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('tipo', sa.String(length=20), nullable=False),
        sa.Column('host', sa.String(length=255), nullable=True),
        sa.Column('porta', sa.Integer(), nullable=True),
        sa.Column('baud_rate', sa.Integer(), nullable=True),
        sa.Column('timeout', sa.Float(), nullable=True),
        sa.Column('ativo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.String(length=30), nullable=True),
        sa.Column('updated_at', sa.String(length=30), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_printer_config_id', 'printer_config', ['id'])


def downgrade():
    op.drop_index('ix_printer_config_id', table_name='printer_config')
    op.drop_table('printer_config')
