#!/usr/bin/env python3
"""
BARIZE - Script de Dados de Exemplo
Popula o banco com dados iniciais para teste e demonstração.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database import SessionLocal, init_db
from app.models.insumo import Insumo
from app.models.produto import Produto
from app.models.receita import Receita
from app.models.usuario import Usuario
from app.models.alerta import AlertaConfig
from app.services.estoque_service import EstoqueService


def seed():
    """Popula banco com dados de exemplo."""
    db = SessionLocal()

    try:
        print("🌱 Seed: Populando dados de exemplo...")

        # ─── Usuários ─────────────────────────────────────
        if not db.query(Usuario).count():
            admin = Usuario(
                nome="Administrador",
                email="admin@barize.com.br",
                username="admin",
                role="admin",
            )
            admin.set_senha("admin123")

            gerente = Usuario(
                nome="Gerente",
                email="gerente@barize.com.br",
                username="gerente",
                role="gerente",
            )
            gerente.set_senha("gerente123")

            bartender = Usuario(
                nome="Bartender",
                email="bartender@barize.com.br",
                username="bartender",
                role="bartender",
                pin="1234",
            )
            bartender.set_senha("bartender123")

            db.add_all([admin, gerente, bartender])
            db.commit()
            print("  ✅ Usuários criados")

        # ─── Insumos ───────────────────────────────────────
        if not db.query(Insumo).count():
            insumos = [
                Insumo(nome="Cachaça Ypióca 965ml", categoria="Bebida", unidade_medida="ml",
                       estoque_atual=5000, estoque_minimo=1000, custo_unitario=0.05),
                Insumo(nome="Limão Taiti", categoria="Insumo", unidade_medida="un",
                       estoque_atual=100, estoque_minimo=20, custo_unitario=0.80),
                Insumo(nome="Xarope de Açúcar", categoria="Insumo", unidade_medida="ml",
                       estoque_atual=2000, estoque_minimo=500, custo_unitario=0.02),
                Insumo(nome="Gelo em Cubos", categoria="Insumo", unidade_medida="un",
                       estoque_atual=500, estoque_minimo=100, custo_unitario=0.10),
                Insumo(nome="Vodka Smirnoff 1L", categoria="Bebida", unidade_medida="ml",
                       estoque_atual=3000, estoque_minimo=500, custo_unitario=0.06),
                Insumo(nome="Suco de Laranja", categoria="Bebida", unidade_medida="ml",
                       estoque_atual=5000, estoque_minimo=1000, custo_unitario=0.01),
                Insumo(nome="Cerveja Brahma Lata 350ml", categoria="Bebida", unidade_medida="un",
                       estoque_atual=200, estoque_minimo=50, custo_unitario=2.50),
                Insumo(nome="Cerveja Heineken Long Neck", categoria="Bebida", unidade_medida="un",
                       estoque_atual=100, estoque_minimo=30, custo_unitario=4.00),
                Insumo(nome="Batata Congelada 1kg", categoria="Insumo", unidade_medida="g",
                       estoque_atual=5000, estoque_minimo=1000, custo_unitario=0.01),
                Insumo(nome="Óleo de Soja", categoria="Insumo", unidade_medida="ml",
                       estoque_atual=3000, estoque_minimo=500, custo_unitario=0.005),
                Insumo(nome="Sal", categoria="Insumo", unidade_medida="g",
                       estoque_atual=500, estoque_minimo=100, custo_unitario=0.002),
                Insumo(nome="Copo Descartável 300ml", categoria="Embalagem", unidade_medida="un",
                       estoque_atual=500, estoque_minimo=100, custo_unitario=0.15),
            ]
            db.add_all(insumos)
            db.commit()
            print("  ✅ Insumos criados")

        # ─── Produtos ─────────────────────────────────────
        if not db.query(Produto).count():
            produtos = [
                Produto(nome="Caipirinha", categoria="Drinks", preco_venda=18.00),
                Produto(nome="Caipiroska", categoria="Drinks", preco_venda=22.00),
                Produto(nome="Cerveja Brahma Lata", categoria="Cervejas", preco_venda=6.00),
                Produto(nome="Heineken Long Neck", categoria="Cervejas", preco_venda=12.00),
                Produto(nome="Porção de Batata Frita", categoria="Porções", preco_venda=25.00),
                Produto(nome="Refrigerante Lata", categoria="Bebidas", preco_venda=5.00),
            ]
            db.add_all(produtos)
            db.commit()
            print("  ✅ Produtos criados")

        # ─── Receitas ──────────────────────────────────────
        if not db.query(Receita).count():
            insumos_map = {i.nome: i for i in db.query(Insumo).all()}
            produtos_map = {p.nome: p for p in db.query(Produto).all()}

            receitas = [
                # Caipirinha: 50ml cachaça + 1 limão + 10ml xarope + 3 gelo + 1 copo
                Receita(produto_id=produtos_map["Caipirinha"].id,
                        insumo_id=insumos_map["Cachaça Ypióca 965ml"].id,
                        quantidade_necessaria=50),
                Receita(produto_id=produtos_map["Caipirinha"].id,
                        insumo_id=insumos_map["Limão Taiti"].id,
                        quantidade_necessaria=1),
                Receita(produto_id=produtos_map["Caipirinha"].id,
                        insumo_id=insumos_map["Xarope de Açúcar"].id,
                        quantidade_necessaria=10),
                Receita(produto_id=produtos_map["Caipirinha"].id,
                        insumo_id=insumos_map["Gelo em Cubos"].id,
                        quantidade_necessaria=3),
                Receita(produto_id=produtos_map["Caipirinha"].id,
                        insumo_id=insumos_map["Copo Descartável 300ml"].id,
                        quantidade_necessaria=1),

                # Caipiroska: 50ml vodka + 50ml suco laranja + 1 limão + 10ml xarope + 3 gelo + 1 copo
                Receita(produto_id=produtos_map["Caipiroska"].id,
                        insumo_id=insumos_map["Vodka Smirnoff 1L"].id,
                        quantidade_necessaria=50),
                Receita(produto_id=produtos_map["Caipiroska"].id,
                        insumo_id=insumos_map["Suco de Laranja"].id,
                        quantidade_necessaria=50),
                Receita(produto_id=produtos_map["Caipiroska"].id,
                        insumo_id=insumos_map["Limão Taiti"].id,
                        quantidade_necessaria=1),
                Receita(produto_id=produtos_map["Caipiroska"].id,
                        insumo_id=insumos_map["Xarope de Açúcar"].id,
                        quantidade_necessaria=10),
                Receita(produto_id=produtos_map["Caipiroska"].id,
                        insumo_id=insumos_map["Gelo em Cubos"].id,
                        quantidade_necessaria=3),
                Receita(produto_id=produtos_map["Caipiroska"].id,
                        insumo_id=insumos_map["Copo Descartável 300ml"].id,
                        quantidade_necessaria=1),

                # Cerveja Brahma: 1 un
                Receita(produto_id=produtos_map["Cerveja Brahma Lata"].id,
                        insumo_id=insumos_map["Cerveja Brahma Lata 350ml"].id,
                        quantidade_necessaria=1),

                # Heineken: 1 un
                Receita(produto_id=produtos_map["Heineken Long Neck"].id,
                        insumo_id=insumos_map["Cerveja Heineken Long Neck"].id,
                        quantidade_necessaria=1),

                # Batata Frita: 300g batata + 200ml óleo + 5g sal
                Receita(produto_id=produtos_map["Porção de Batata Frita"].id,
                        insumo_id=insumos_map["Batata Congelada 1kg"].id,
                        quantidade_necessaria=300),
                Receita(produto_id=produtos_map["Porção de Batata Frita"].id,
                        insumo_id=insumos_map["Óleo de Soja"].id,
                        quantidade_necessaria=200),
                Receita(produto_id=produtos_map["Porção de Batata Frita"].id,
                        insumo_id=insumos_map["Sal"].id,
                        quantidade_necessaria=5),
            ]
            db.add_all(receitas)
            db.commit()
            print("  ✅ Receitas criadas")

        # ─── Alerta de Estoque Mínimo ──────────────────────
        if not db.query(AlertaConfig).count():
            alerta = AlertaConfig(
                nome="Estoque Baixo",
                tipo="ESTOQUE_MINIMO",
                ativo=True,
                notificar_discord=False,
                notificar_telegram=False,
                notificar_slack=False,
            )
            db.add(alerta)
            db.commit()
            print("  ✅ Alerta de estoque mínimo configurado")

        print("")
        print("═══════════════════════════════════════════════")
        print("  🌱 Seed concluído com sucesso!")
        print("")
        print("  Usuários:")
        print("    admin    / admin123     (admin)")
        print("    gerente  / gerente123   (gerente)")
        print("    bartender / bartender123 (bartender)")
        print("═══════════════════════════════════════════════")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro durante seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
