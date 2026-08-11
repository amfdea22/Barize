"""add foto_url to funcionarios (foto do funcionário no RH)

Revision ID: 0017
Revises: 0016
Create Date: 2026-08-09

"""
from alembic import op
import sqlalchemy as sa


revision = '0017'
down_revision = '0016'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('funcionarios', sa.Column('foto_url', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('funcionarios', 'foto_url')
