"""add setor to printer_config (multi-impressora por setor)

Revision ID: 0016
Revises: 0015
Create Date: 2026-08-08

"""
from alembic import op
import sqlalchemy as sa


revision = '0016'
down_revision = '0015'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('printer_config', sa.Column('setor', sa.String(20), nullable=True))
    op.execute("UPDATE printer_config SET setor = 'CAIXA' WHERE setor IS NULL OR setor = ''")
    op.alter_column('printer_config', 'setor', nullable=False)
    op.create_index('ix_printer_config_setor', 'printer_config', ['setor'])


def downgrade():
    op.drop_index('ix_printer_config_setor', table_name='printer_config')
    op.drop_column('printer_config', 'setor')
