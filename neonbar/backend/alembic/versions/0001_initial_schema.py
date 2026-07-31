"""BARIZE - Initial Schema

Revision ID: 0001
Revises:
Create Date: 2026-07-16

Pilar 3: Versionamento de Schema (Alembic)
Pilar 5: Integridade Referencial com ON DELETE RESTRICT
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Usuários (RBAC) ────────────────────────────────
    op.create_table(
        "usuarios",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("senha_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False, server_default="bartender"),
        sa.Column("ativo", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("pin", sa.String(6), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("ultimo_login", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_usuarios_username", "usuarios", ["username"])
    op.create_index("ix_usuarios_email", "usuarios", ["email"])

    # ─── Insumos ─────────────────────────────────────────
    op.create_table(
        "insumos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("descricao", sa.String(500), nullable=True),
        sa.Column("categoria", sa.String(100), nullable=True),
        sa.Column("unidade_medida", sa.String(20), nullable=False, server_default="un"),
        sa.Column("estoque_atual", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("estoque_minimo", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("custo_unitario", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("ativo", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_index("ix_insumos_nome", "insumos", ["nome"])

    # ─── Produtos ────────────────────────────────────────
    op.create_table(
        "produtos",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("categoria", sa.String(100), nullable=True),
        sa.Column("preco_venda", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("codigo_barras", sa.String(50), nullable=True),
        sa.Column("ativo", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("codigo_barras"),
        sa.UniqueConstraint("nome"),
    )
    op.create_index("ix_produtos_nome", "produtos", ["nome"])

    # ─── Receitas (FK com RESTRICT) ─────────────────────
    op.create_table(
        "receitas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("produto_id", sa.Integer(), nullable=False),
        sa.Column("insumo_id", sa.Integer(), nullable=False),
        sa.Column("quantidade_necessaria", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["produto_id"], ["produtos.id"],
            ondelete="CASCADE",  # Se produto for deletado, receitas somem
        ),
        sa.ForeignKeyConstraint(
            ["insumo_id"], ["insumos.id"],
            ondelete="RESTRICT",  # NÃO permite deletar insumo com receita
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("produto_id", "insumo_id", name="uq_receita_produto_insumo"),
    )
    op.create_index("ix_receitas_insumo_id", "receitas", ["insumo_id"])
    op.create_index("ix_receitas_produto_id", "receitas", ["produto_id"])

    # ─── Movimentações ──────────────────────────────────
    op.create_table(
        "movimentacoes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("insumo_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("quantidade", sa.Float(), nullable=False),
        sa.Column("custo_no_momento", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("produto_id", sa.Integer(), nullable=True),
        sa.Column("documento_referencia", sa.String(100), nullable=True),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("data", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["insumo_id"], ["insumos.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["produto_id"], ["produtos.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["usuario_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_movimentacoes_data", "movimentacoes", ["data"])
    op.create_index("ix_movimentacoes_insumo_id", "movimentacoes", ["insumo_id"])
    op.create_index("ix_movimentacoes_tipo", "movimentacoes", ["tipo"])

    # ─── Fila de Impressão ──────────────────────────────
    op.create_table(
        "fila_impressao",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("tipo", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="PENDENTE"),
        sa.Column("dados_json", sa.JSON(), nullable=False),
        sa.Column("impressora_destino", sa.String(100), nullable=True),
        sa.Column("tentativas", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("erro_msg", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_fila_impressao_status", "fila_impressao", ["status"])
    op.create_index("ix_fila_impressao_tipo", "fila_impressao", ["tipo"])

    # ─── Caixa ───────────────────────────────────────────
    op.create_table(
        "caixas",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="ABERTO"),
        sa.Column("saldo_inicial", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("saldo_final_esperado", sa.Float(), nullable=True),
        sa.Column("saldo_final_declarado", sa.Float(), nullable=True),
        sa.Column("diferenca", sa.Float(), nullable=True),
        sa.Column("valores_declarados", sa.JSON(), nullable=True),
        sa.Column("observacao", sa.Text(), nullable=True),
        sa.Column("data_abertura", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("data_fechamento", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # ─── Fechamentos de Caixa ──────────────────────────
    op.create_table(
        "fechamentos_caixa",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("caixa_id", sa.Integer(), nullable=False),
        sa.Column("forma_pagamento", sa.String(50), nullable=False),
        sa.Column("valor_sistema", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("valor_declarado", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("diferenca", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_fechamentos_caixa_id", "fechamentos_caixa", ["caixa_id"])

    # ─── Audit Logs ─────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("usuario_id", sa.Integer(), nullable=True),
        sa.Column("usuario_nome", sa.String(200), nullable=True),
        sa.Column("acao", sa.String(100), nullable=False),
        sa.Column("entidade_tipo", sa.String(50), nullable=True),
        sa.Column("entidade_id", sa.Integer(), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("estado_anterior", sa.JSON(), nullable=True),
        sa.Column("estado_novo", sa.JSON(), nullable=True),
        sa.Column("motivo", sa.Text(), nullable=True),
        sa.Column("ip_origem", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_acao", "audit_logs", ["acao"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_audit_logs_usuario_id", "audit_logs", ["usuario_id"])

    # ─── Alertas Config ────────────────────────────────
    op.create_table(
        "alertas_config",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(200), nullable=False),
        sa.Column("tipo", sa.String(50), nullable=False),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("config_json", sa.String(500), nullable=True),
        sa.Column("notificar_discord", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notificar_telegram", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("notificar_slack", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alertas_config_tipo", "alertas_config", ["tipo"])

    # ─── Alertas Disparados ────────────────────────────
    op.create_table(
        "alertas_disparados",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("alerta_config_id", sa.Integer(), nullable=True),
        sa.Column("tipo", sa.String(50), nullable=False),
        sa.Column("mensagem", sa.Text(), nullable=False),
        sa.Column("canal", sa.String(50), nullable=True),
        sa.Column("entregue", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("erro_msg", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alertas_disparados_tipo", "alertas_disparados", ["tipo"])


def downgrade() -> None:
    """Remove todas as tabelas na ordem inversa (para respeitar FKs)."""
    op.drop_table("alertas_disparados")
    op.drop_table("alertas_config")
    op.drop_table("audit_logs")
    op.drop_table("fechamentos_caixa")
    op.drop_table("caixas")
    op.drop_table("fila_impressao")
    op.drop_table("movimentacoes")
    op.drop_table("receitas")
    op.drop_table("produtos")
    op.drop_table("insumos")
    op.drop_table("usuarios")
