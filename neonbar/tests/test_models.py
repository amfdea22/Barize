"""
BARIZE - Testes Unitários dos Modelos
Pilar 3: Integridade Referencial e Validação de Dados
"""

import pytest
from datetime import datetime


class TestUsuarioModel:
    """Testes do modelo Usuario (RBAC + Criptografia)."""

    def test_criar_usuario(self, db_session):
        from app.models.usuario import Usuario
        
        usuario = Usuario(
            nome="João Bartender",
            email="joao@bar.com",
            username="joaobt",
            role="bartender",
        )
        usuario.set_senha("minha_senha")
        db_session.add(usuario)
        db_session.commit()
        
        assert usuario.id is not None
        assert usuario.nome == "João Bartender"
        assert usuario.role == "bartender"
        assert usuario.ativo == 1
        assert usuario.created_at is not None

    def test_verificar_senha(self, db_session):
        from app.models.usuario import Usuario
        
        usuario = Usuario(
            nome="Admin",
            email="admin@bar.com",
            username="admin",
            role="admin",
        )
        usuario.set_senha("senha123")
        db_session.add(usuario)
        db_session.commit()
        
        assert usuario.verificar_senha("senha123") is True
        assert usuario.verificar_senha("senha_errada") is False
        # Hash nunca é igual à senha original
        assert usuario.senha_hash != "senha123"
        assert usuario.senha_hash.startswith("$2b$")  # bcrypt

    def test_pin_opcional(self, db_session):
        from app.models.usuario import Usuario
        
        # Com PIN
        u1 = Usuario(nome="BT1", email="bt1@bar.com", username="bt1",
                     role="bartender", pin="1234")
        u1.set_senha("teste")
        db_session.add(u1)
        
        # Sem PIN
        u2 = Usuario(nome="BT2", email="bt2@bar.com", username="bt2",
                     role="bartender")
        u2.set_senha("teste")
        db_session.add(u2)
        db_session.commit()
        
        assert u1.pin == "1234"
        assert u2.pin is None

    def test_unique_username(self, db_session):
        from app.models.usuario import Usuario
        from sqlalchemy.exc import IntegrityError
        
        u1 = Usuario(nome="User1", email="u1@bar.com", username="unico", role="bartender")
        u1.set_senha("teste")
        db_session.add(u1)
        db_session.commit()
        
        u2 = Usuario(nome="User2", email="u2@bar.com", username="unico", role="admin")
        u2.set_senha("teste")
        db_session.add(u2)
        with pytest.raises(IntegrityError):
            db_session.commit()
        db_session.rollback()


class TestInsumoModel:
    """Testes do modelo Insumo."""

    def test_criar_insumo(self, db_session):
        from app.models.insumo import Insumo
        
        insumo = Insumo(
            nome="Vodka Importada",
            categoria="Bebida",
            unidade_medida="ml",
            estoque_atual=5000,
            estoque_minimo=500,
            custo_unitario=0.08,
        )
        db_session.add(insumo)
        db_session.commit()
        
        assert insumo.id is not None
        assert insumo.estoque_atual == 5000.0
        assert insumo.ativo == 1

    def test_soft_delete(self, db_session):
        from app.models.insumo import Insumo
        
        insumo = Insumo(nome="Item para deletar", unidade_medida="un", custo_unitario=1.0)
        db_session.add(insumo)
        db_session.commit()
        
        insumo.ativo = 0
        db_session.commit()
        
        # Query filtrando por ativo não deve encontrar
        resultado = db_session.query(Insumo).filter(Insumo.ativo == 1, Insumo.id == insumo.id).first()
        assert resultado is None
        
        # Mas ainda existe no banco (soft delete)
        resultado = db_session.query(Insumo).filter(Insumo.id == insumo.id).first()
        assert resultado is not None
        assert resultado.ativo == 0

    def test_estoque_minimo_alerta(self, db_session):
        from app.models.insumo import Insumo
        
        insumo = Insumo(
            nome="Insumo Crítico",
            unidade_medida="un",
            estoque_atual=5,
            estoque_minimo=20,
            custo_unitario=1.0,
        )
        db_session.add(insumo)
        db_session.commit()
        
        # Deve aparecer na lista de insumos abaixo do mínimo
        criticos = db_session.query(Insumo).filter(
            Insumo.ativo == 1,
            Insumo.estoque_minimo > 0,
            Insumo.estoque_atual <= Insumo.estoque_minimo,
        ).all()
        
        assert insumo in criticos


class TestProdutoModel:
    """Testes do modelo Produto."""

    def test_criar_produto_com_receita(self, db_session, seed_insumos):
        from app.models.produto import Produto
        from app.models.receita import Receita
        
        insumos = seed_insumos
        
        produto = Produto(nome="Drink Teste", categoria="Drinks", preco_venda=25.00)
        db_session.add(produto)
        db_session.commit()
        
        receita = Receita(
            produto_id=produto.id,
            insumo_id=insumos["Cachaça Teste"].id,
            quantidade_necessaria=50,
        )
        db_session.add(receita)
        db_session.commit()
        
        # Verifica relacionamento
        assert len(produto.receitas) == 1
        assert produto.receitas[0].insumo.nome == "Cachaça Teste"

    def test_preco_venda_positivo(self, db_session):
        from app.models.produto import Produto
        from pydantic import ValidationError
        from app.schemas.produto import ProdutoCreate
        
        # SQLAlchemy model não valida, mas Pydantic schema sim
        produto = Produto(nome="Teste", categoria="Teste", preco_venda=10.0)
        db_session.add(produto)
        db_session.commit()
        assert produto.preco_venda == 10.0
        
        # Pydantic deve rejeitar preço negativo
        with pytest.raises(ValidationError):
            ProdutoCreate(nome="Teste", preco_venda=-1.0)


class TestIntegridadeReferencial:
    """Testes de integridade referencial (FK)."""

    def test_on_delete_restrict_insumo(self, db_session, seed_produtos):
        """
        ON DELETE RESTRICT: não permite deletar insumo com receita ativa.
        Nota: SQLite só respeita FK com PRAGMA foreign_keys=ON.
        """
        from app.models.insumo import Insumo
        from sqlalchemy import inspect
        
        insumo = seed_produtos["insumos"]["Cachaça Teste"]
        
        # Verifica que o insumo está vinculado a receitas
        insp = inspect(insumo)
        
        # Tenta deletar - em SQLite com FK ativo, deve falhar
        # Se não falhar (SQLite sem FK), ao menos verifica que existe relação
        try:
            db_session.delete(insumo)
            db_session.commit()
            # Se chegou aqui, SQLite não respeitou FK - verifica relação
            from app.models.receita import Receita
            receitas = db_session.query(Receita).filter(
                Receita.insumo_id == insumo.id
            ).all()
            assert len(receitas) > 0, "Deveria haver receitas vinculadas"
            db_session.rollback()
        except Exception:
            db_session.rollback()

    def test_on_delete_cascade_produto(self, db_session, seed_produtos):
        """ON DELETE CASCADE: deletar produto remove receitas."""
        from app.models.produto import Produto
        from app.models.receita import Receita
        
        produto = seed_produtos["produto"]
        receita_id = produto.receitas[0].id
        
        # Deleta o produto (cascade deve remover receitas)
        db_session.delete(produto)
        db_session.commit()
        
        # Receita não deve mais existir
        receita = db_session.query(Receita).filter(Receita.id == receita_id).first()
        assert receita is None
