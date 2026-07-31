"""
BARIZE - Script de Seed (Dados de Exemplo)
Popula o banco com usuários, insumos, produtos e receitas para demonstração.
Uso: python -m scripts.seed_data
"""

import os
import sys

# Adiciona o diretório backend ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_engine, Base, SessionLocal
from app.models.usuario import Usuario
from app.models.insumo import Insumo
from app.models.lote import Lote
from app.models.produto_lote import ProdutoLote
from app.models.produto import Produto
from app.models.receita import Receita
from app.models.movimentacao import Movimentacao
from app.models.caixa import Caixa
from app.models.audit_log import AuditLog


def seed():
    # Cria tabelas
    Base.metadata.create_all(bind=get_engine())
    db = SessionLocal()

    try:
        # ─── Usuários ───
        if db.query(Usuario).count() == 0:
            admin = Usuario(
                nome="Administrador",
                email="admin@barize.com",
                username="admin",
                role="admin",
                ativo=1,
                pin="1234",
            )
            admin.set_senha("admin123")

            gerente = Usuario(
                nome="Gerente Bar",
                email="gerente@barize.com",
                username="gerente",
                role="gerente",
                ativo=1,
                pin="5678",
            )
            gerente.set_senha("gerente123")

            bartender = Usuario(
                nome="Bartender João",
                email="joao@barize.com",
                username="bartender",
                role="bartender",
                ativo=1,
                pin="9999",
            )
            bartender.set_senha("bartender123")

            db.add_all([admin, gerente, bartender])
            db.commit()
            print("[OK] Usuários criados (admin/admin123, gerente/gerente123, bartender/bartender123)")

        # ─── Insumos ───
        if db.query(Insumo).count() == 0:
            insumos_data = [
                ("Cachaça 51", "Destilado", "ml", 5000, 1000, 0.05),
                ("Vodka", "Destilado", "ml", 3000, 1000, 0.08),
                ("Gin", "Destilado", "ml", 2000, 500, 0.12),
                ("Limão", "Insumo", "un", 200, 50, 0.80),
                ("Laranja", "Insumo", "un", 150, 40, 0.60),
                ("Xarope de Açúcar", "Insumo", "ml", 2000, 500, 0.03),
                ("Gelo", "Insumo", "un", 500, 100, 0.10),
                ("Água Tônica", "Bebida", "ml", 4000, 1000, 0.04),
                ("Cerveja Long Neck", "Bebida", "un", 300, 80, 4.50),
                ("Refrigerante Cola", "Bebida", "ml", 5000, 1500, 0.02),
            ]
            insumos = []
            for nome, cat, un, estoque, minimo, custo in insumos_data:
                insumo = Insumo(
                    nome=nome,
                    categoria=cat,
                    unidade_medida=un,
                    estoque_atual=estoque,
                    estoque_minimo=minimo,
                    custo_unitario=custo,
                    ativo=1,
                )
                insumos.append(insumo)
                db.add(insumo)
            db.commit()
            print(f"[OK] {len(insumos)} insumos criados")

        # ─── Produtos ───
        if db.query(Produto).count() == 0:
            produtos_data = [
                ("Caipirinha", "Drinks", 18.00, "Clássico brasileiro", "🍋"),
                ("Caipiroska", "Drinks", 20.00, "Com vodka", "🍸"),
                ("Gin Tônica", "Drinks", 25.00, "Gin com água tônica", "🍹"),
                ("Cerveja Long Neck", "Cervejas", 9.00, "300ml", "🍺"),
                ("Refrigerante", "Bebidas", 6.00, "Lata 350ml", "🥤"),
                ("Suco de Laranja", "Bebidas", 8.00, "Natural", "🧃"),
                ("Porção de Batata", "Porções", 22.00, "Frita com cheddar", "🍟"),
                ("Água Mineral", "Bebidas", 5.00, "500ml", "💧"),
            ]
            produtos = []
            for nome, cat, preco, desc, emoji in produtos_data:
                produto = Produto(
                    nome=nome,
                    categoria=cat,
                    preco_venda=preco,
                    descricao=desc,
                    imagem=emoji,
                    ativo=1,
                )
                produtos.append(produto)
                db.add(produto)
            db.commit()
            print(f"[OK] {len(produtos)} produtos criados")

            # ─── Receitas ───
            insumo_map = {i.nome: i for i in db.query(Insumo).all()}
            produto_map = {p.nome: p for p in db.query(Produto).all()}

            receitas_data = [
                ("Caipirinha", [("Cachaça 51", 50), ("Limão", 1), ("Xarope de Açúcar", 10), ("Gelo", 3)]),
                ("Caipiroska", [("Vodka", 50), ("Limão", 1), ("Xarope de Açúcar", 10), ("Gelo", 3)]),
                ("Gin Tônica", [("Gin", 50), ("Água Tônica", 150), ("Gelo", 2)]),
                ("Cerveja Long Neck", [("Cerveja Long Neck", 1)]),
                ("Refrigerante", [("Refrigerante Cola", 350)]),
                ("Suco de Laranja", [("Laranja", 3), ("Gelo", 2)]),
                ("Água Mineral", [("Gelo", 1)]),
            ]
            for prod_nome, comp in receitas_data:
                produto = produto_map.get(prod_nome)
                if not produto:
                    continue
                for ins_nome, qtd in comp:
                    insumo = insumo_map.get(ins_nome)
                    if not insumo:
                        continue
                    receita = Receita(
                        produto_id=produto.id,
                        insumo_id=insumo.id,
                        quantidade_necessaria=qtd,
                    )
                    db.add(receita)
            db.commit()
            print("[OK] Receitas criadas")

        # ─── Lotes (para etiquetas) ───
        if db.query(Lote).count() == 0:
            from datetime import date, timedelta
            import random

            hoje = date.today()
            lotes_criados = 0
            for insumo in db.query(Insumo).all():
                qtd_lotes = random.randint(1, 3)
                for i in range(qtd_lotes):
                    dias_val = random.choice([15, 30, 45, 60, 90, 120, -5, -10])
                    lote = Lote(
                        insumo_id=insumo.id,
                        codigo_lote=f"LOTE-{insumo.id}-{i+1:03d}",
                        quantidade_atual=random.randint(10, 5000),
                        data_fabricacao=hoje - timedelta(days=random.randint(1, 60)),
                        data_validade=hoje + timedelta(days=dias_val) if dias_val > 0 else hoje + timedelta(days=dias_val),
                    )
                    db.add(lote)
                    lotes_criados += 1
            db.commit()

            for produto in db.query(Produto).all():
                qtd_lotes = random.randint(1, 2)
                for i in range(qtd_lotes):
                    dias_val = random.choice([15, 30, 45, 60])
                    plote = ProdutoLote(
                        produto_id=produto.id,
                        codigo_lote=f"PLOTE-{produto.id}-{i+1:03d}",
                        quantidade=random.randint(5, 50),
                        data_validade=hoje + timedelta(days=dias_val),
                    )
                    db.add(plote)
                    lotes_criados += 1
            db.commit()
            print(f"[OK] {lotes_criados} lotes criados para etiquetas")

        print("\n[DONE] Seed concluído com sucesso!")
        print("Credenciais de acesso:")
        print("  admin / admin123 (Admin)")
        print("  gerente / gerente123 (Gerente)")
        print("  bartender / bartender123 (Bartender)")

    except Exception as e:
        db.rollback()
        print(f"[ERRO] Erro no seed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
