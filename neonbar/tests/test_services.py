"""
BARIZE - Testes dos Serviços (Lógica de Negócio)
Pilar 3: Estoque, CMV, Caixa
Pilar 5: Auditoria
"""

import pytest
from datetime import datetime, date


class TestEstoqueService:
    """Testes do serviço de estoque."""

    def test_dar_entrada(self, db_session, seed_insumos):
        """Entrada de mercadoria deve aumentar estoque e calcular custo médio."""
        from app.services.estoque_service import EstoqueService
        
        insumo = seed_insumos["Cachaça Teste"]
        estoque_anterior = insumo.estoque_atual
        
        sucesso, msg = EstoqueService.dar_entrada(
            db=db_session,
            insumo_id=insumo.id,
            quantidade=500,
            custo_compra=0.06,
        )
        
        assert sucesso is True
        assert insumo.estoque_atual == estoque_anterior + 500
        
        # Verifica movimentação criada
        from app.models.movimentacao import Movimentacao
        mov = db_session.query(Movimentacao).filter(
            Movimentacao.insumo_id == insumo.id,
            Movimentacao.tipo == "COMPRA",
        ).first()
        assert mov is not None
        assert mov.quantidade == 500

    def test_dar_entrada_insumo_invalido(self, db_session):
        """Entrada em insumo inexistente deve falhar."""
        from app.services.estoque_service import EstoqueService
        
        sucesso, msg = EstoqueService.dar_entrada(
            db=db_session,
            insumo_id=99999,
            quantidade=100,
            custo_compra=1.0,
        )
        
        assert sucesso is False
        assert "não encontrado" in msg.lower()

    def test_realizar_baixa(self, db_session, seed_produtos):
        """Venda de produto deve consumir insumos corretamente."""
        from app.services.estoque_service import EstoqueService
        
        produto = seed_produtos["produto"]
        insumo_cachaca = seed_produtos["insumos"]["Cachaça Teste"]
        estoque_inicial = insumo_cachaca.estoque_atual
        
        sucesso, msg = EstoqueService.realizar_baixa(
            db=db_session,
            produto_id=produto.id,
            quantidade_vendida=2,
        )
        
        assert sucesso is True
        # Cada caipirinha consome 50ml de cachaça, 2 unidades = 100ml
        assert insumo_cachaca.estoque_atual == estoque_inicial - 100

    def test_realizar_baixa_estoque_insuficiente(self, db_session, seed_produtos):
        """Venda sem estoque suficiente deve falhar."""
        from app.services.estoque_service import EstoqueService
        
        produto = seed_produtos["produto"]
        insumo = seed_produtos["insumos"]["Limão Teste"]
        insumo.estoque_atual = 0  # Zera estoque
        db_session.commit()
        
        sucesso, msg = EstoqueService.realizar_baixa(
            db=db_session,
            produto_id=produto.id,
            quantidade_vendida=1,
        )
        
        assert sucesso is False
        assert "insuficiente" in msg.lower()

    def test_realizar_baixa_sem_receita(self, db_session):
        """Produto sem receita cadastrada deve falhar."""
        from app.services.estoque_service import EstoqueService
        from app.models.produto import Produto
        
        produto = Produto(nome="Produto Sem Receita", categoria="Teste", preco_venda=10.0)
        db_session.add(produto)
        db_session.commit()
        
        sucesso, msg = EstoqueService.realizar_baixa(
            db=db_session,
            produto_id=produto.id,
        )
        
        assert sucesso is False
        assert "não possui receita" in msg.lower()

    def test_ajustar_estoque(self, db_session, seed_insumos):
        """Ajuste manual de inventário."""
        from app.services.estoque_service import EstoqueService
        
        insumo = seed_insumos["Gelo Teste"]
        
        sucesso, msg = EstoqueService.ajustar_estoque(
            db=db_session,
            insumo_id=insumo.id,
            novo_estoque=150,
            motivo="Inventário físico: contamos 150 unidades",
        )
        
        assert sucesso is True
        assert insumo.estoque_atual == 150

    def test_registrar_perda(self, db_session, seed_insumos):
        """Registro de perda deve reduzir estoque."""
        from app.services.estoque_service import EstoqueService
        
        insumo = seed_insumos["Limão Teste"]
        
        sucesso, msg = EstoqueService.registrar_perda(
            db=db_session,
            insumo_id=insumo.id,
            quantidade=5,
            motivo="Limões estragados",
        )
        
        assert sucesso is True
        assert insumo.estoque_atual == 45  # 50 - 5

    def test_verificar_estoque_minimo(self, db_session):
        """Verifica retorno de insumos abaixo do mínimo."""
        from app.services.estoque_service import EstoqueService
        from app.models.insumo import Insumo
        
        # Cria insumo abaixo do mínimo
        insumo = Insumo(
            nome="Teste Baixo Estoque",
            unidade_medida="un",
            estoque_atual=5,
            estoque_minimo=20,
            custo_unitario=1.0,
        )
        db_session.add(insumo)
        db_session.commit()
        
        criticos = EstoqueService.verificar_estoque_minimo(db_session)
        assert len(criticos) >= 1
        assert insumo in criticos


class TestCmvService:
    """Testes do cálculo de CMV."""

    def test_calcular_cmv_sem_vendas(self, db_session):
        """CMV sem vendas deve ser zero."""
        from app.services.estoque_service import EstoqueService
        
        resultado = EstoqueService.calcular_cmv(db_session)
        assert resultado["custo_total"] == 0.0
        assert resultado["receita_total"] == 0.0
        assert resultado["cmv_percentual"] == 0.0

    def test_calcular_cmv_com_vendas(self, db_session, seed_produtos):
        """CMV com vendas deve calcular corretamente."""
        from app.services.estoque_service import EstoqueService
        
        # Realiza algumas vendas
        produto = seed_produtos["produto"]
        EstoqueService.realizar_baixa(db_session, produto.id, 2)
        
        resultado = EstoqueService.calcular_cmv(db_session)
        
        # Custo: 2x caipirinha = 100ml cachaça (R$0.05/ml) + 2 limões (R$0.80) + 6 gelo (R$0.10)
        # = R$5.00 + R$1.60 + R$0.60 = R$7.20
        assert resultado["custo_total"] > 0
        # Receita: 2 x R$18.00 = R$36.00
        assert resultado["receita_total"] == 36.0
        # CMV% = 7.20 / 36.00 * 100 = 20%
        assert resultado["cmv_percentual"] > 0


class TestCaixaService:
    """Testes do serviço de caixa."""

    def test_abrir_caixa(self, db_session):
        """Abertura de caixa deve criar registro."""
        from app.services.caixa_service import CaixaService
        
        sucesso, msg, caixa = CaixaService.abrir_caixa(
            db=db_session,
            usuario_id=1,
            saldo_inicial=100.0,
        )
        
        assert sucesso is True
        assert caixa.status == "ABERTO"
        assert caixa.saldo_inicial == 100.0

    def test_abrir_dois_caixas_simultaneos(self, db_session):
        """Não deve permitir dois caixas abertos simultaneamente."""
        from app.services.caixa_service import CaixaService
        
        CaixaService.abrir_caixa(db_session, usuario_id=1)
        
        sucesso, msg, caixa = CaixaService.abrir_caixa(db_session, usuario_id=2)
        assert sucesso is False
        assert "já existe um caixa aberto" in msg.lower()

    def test_fechar_caixa(self, db_session):
        """Fechamento de caixa deve calcular diferenças."""
        from app.services.caixa_service import CaixaService
        
        sucesso, _, caixa = CaixaService.abrir_caixa(
            db_session, usuario_id=1, saldo_inicial=100.0
        )
        assert sucesso
        
        # Fecha com valores declarados
        sucesso, msg, resultado = CaixaService.fechar_caixa(
            db=db_session,
            caixa_id=caixa.id,
            valores_declarados={
                "dinheiro": 500.0,
                "cartao_credito": 300.0,
                "pix": 200.0,
            },
        )
        
        assert sucesso is True
        assert resultado["saldo_inicial"] == 100.0
        assert resultado["saldo_declarado"] == 1000.0  # 500+300+200

    def test_resumo_diario(self, db_session):
        """Resumo diário deve retornar métricas."""
        from app.services.caixa_service import CaixaService
        
        from datetime import date
        resumo = CaixaService.obter_resumo_diario(db_session, data=date.today())
        
        assert "receita_total" in resumo
        assert "total_itens_vendidos" in resumo
        assert "caixas_abertos" in resumo


class TestAuditService:
    """Testes do serviço de auditoria."""

    def test_registrar_audit(self, db_session):
        """Registro de auditoria deve criar log."""
        from app.services.audit_service import AuditService
        
        log = AuditService.registrar(
            db=db_session,
            acao="TESTE_ACAO",
            usuario_id=1,
            usuario_nome="Admin",
            entidade_tipo="Produto",
            entidade_id=42,
            descricao="Teste de auditoria",
            estado_anterior={"nome": "Antigo"},
            estado_novo={"nome": "Novo"},
            motivo="Teste unitário",
        )
        
        assert log.id is not None
        assert log.acao == "TESTE_ACAO"
        assert log.estado_anterior == {"nome": "Antigo"}

    def test_listar_audit(self, db_session):
        """Listagem de auditoria deve retornar logs ordenados."""
        from app.services.audit_service import AuditService
        
        AuditService.registrar(db_session, acao="ACAO_1", usuario_id=1)
        AuditService.registrar(db_session, acao="ACAO_2", usuario_id=1)
        AuditService.registrar(db_session, acao="ACAO_3", usuario_id=1)
        
        logs = AuditService.listar(db_session, limit=2)
        assert len(logs) == 2  # limit funcionou
        
        logs_todas = AuditService.listar(db_session)
        assert len(logs_todas) >= 3  # todas as ações

    def test_filtro_audit_por_acao(self, db_session):
        """Filtro por ação deve funcionar."""
        from app.services.audit_service import AuditService
        
        AuditService.registrar(db_session, acao="VENDA_REALIZADA", usuario_id=1)
        AuditService.registrar(db_session, acao="ESTOQUE_AJUSTE", usuario_id=1)
        
        logs = AuditService.listar(db_session, acao="VENDA_REALIZADA")
        assert len(logs) == 1
        assert logs[0].acao == "VENDA_REALIZADA"
