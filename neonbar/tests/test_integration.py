"""
BARIZE - Testes de Integração
Fluxo completo: PDV → Estoque → Caixa → CMV → Auditoria
"""

import pytest
from fastapi import status


class TestFluxoCompletoVenda:
    """
    Teste de integração: Fluxo completo de uma venda no bar.
    
    Cenário: Cliente pede 2 Caipirinhas, paga em dinheiro.
    Fluxo:  Health → Vender → Verificar estoque → Movimentações → Auditoria → CMV → Caixa → Perda → Dashboard
    """
    # Escopo class-level para compartilhar estado entre asserts
    produto = None
    insumos = None
    estoque_inicial = {}
    headers = {}

    def test_fluxo_completo(self, client, admin_token, seed_produtos):
        """Fluxo completo de ponta a ponta."""
        produto = seed_produtos["produto"]
        insumos = seed_produtos["insumos"]
        headers = {"Authorization": f"Bearer {admin_token}"}

        estoque_inicial = {
            "cachaca": insumos["Cachaça Teste"].estoque_atual,
            "limao": insumos["Limão Teste"].estoque_atual,
            "gelo": insumos["Gelo Teste"].estoque_atual,
        }

        # ── 1. Health Check ──
        response = client.get("/api/v1/admin/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

        # ── 2. Abrir Caixa (antes da venda para o fechamento capturar a receita) ──
        response = client.post(
            "/api/v1/caixa/abrir",
            headers=headers,
            json={"usuario_id": 1, "saldo_inicial": 100.0},
        )
        assert response.status_code == 200
        caixa_id = response.json()["caixa"]["id"]

        # ── 3. Realizar Venda ──
        response = client.post(
            f"/api/v1/pdv/vender?produto_id={produto.id}&quantidade=2&imprimir_comanda=false",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["sucesso"] is True
        assert data["quantidade"] == 2
        assert data["valor_total"] == 36.0  # 2 x R$18.00

        # ── 4. Verificar Estoque após venda ──
        response = client.get("/api/v1/estoque/insumos", headers=headers)
        assert response.status_code == 200
        api_insumos = response.json()
        insumo_cachaca = next(i for i in api_insumos if i["nome"] == "Cachaça Teste")
        assert insumo_cachaca["estoque_atual"] == estoque_inicial["cachaca"] - 100

        # ── 5. Verificar Movimentações ──
        response = client.get(
            "/api/v1/estoque/movimentacoes?tipo=VENDA", headers=headers
        )
        assert response.status_code == 200
        movs = response.json()
        assert len(movs) >= 3  # 3 insumos consumidos
        for mov in movs:
            if mov["insumo_id"] == insumos["Cachaça Teste"].id:
                assert mov["quantidade"] == -100.0
            elif mov["insumo_id"] == insumos["Limão Teste"].id:
                assert mov["quantidade"] == -2.0
            elif mov["insumo_id"] == insumos["Gelo Teste"].id:
                assert mov["quantidade"] == -6.0

        # ── 6. Verificar Auditoria ──
        response = client.get(
            "/api/v1/relatorios/auditoria?acao=VENDA_REALIZADA", headers=headers
        )
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) >= 1
        assert logs[0]["acao"] == "VENDA_REALIZADA"

        # ── 7. Calcular CMV ──
        response = client.get("/api/v1/cmv/calcular?dias=30", headers=headers)
        assert response.status_code == 200
        cmv = response.json()
        assert cmv["custo_total"] > 0
        assert cmv["receita_total"] >= 36.0
        assert 0 < cmv["cmv_percentual"] <= 100

        # ── 8. Fechar Caixa ──
        response = client.post(
            f"/api/v1/caixa/fechar/{caixa_id}",
            headers=headers,
            json={
                "valores_declarados": {
                    "dinheiro": 136.0,
                    "cartao_credito": 0.0,
                    "pix": 0.0,
                },
            },
        )
        assert response.status_code == 200
        resultado = response.json()["resultado"]
        assert resultado["saldo_inicial"] == 100.0
        assert resultado["receita_total"] >= 36.0

        # ── 9. Registrar Perda ──
        response = client.post(
            "/api/v1/estoque/perda",
            headers=headers,
            params={
                "insumo_id": insumos["Limão Teste"].id,
                "quantidade": 3,
                "motivo": "Limões caíram no chão",
            },
        )
        assert response.status_code == 200

        response = client.get("/api/v1/estoque/insumos", headers=headers)
        api_insumos = response.json()
        limao = next(i for i in api_insumos if i["nome"] == "Limão Teste")
        # Estoque inicial 50 - 2 (venda) - 3 (perda) = 45
        assert limao["estoque_atual"] == 45.0

        # ── 10. Verificar Audit Perda ──
        response = client.get(
            "/api/v1/relatorios/auditoria?acao=PERDA_REGISTRADA", headers=headers
        )
        assert response.status_code == 200
        logs = response.json()
        assert len(logs) >= 1
        assert logs[0]["entidade_tipo"] == "Insumo"

        # ── 11. Dashboard Executivo ──
        response = client.get(
            "/api/v1/relatorios/dashboard-executivo", headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        indicadores = data["indicadores"]
        assert indicadores["total_insumos"] >= 3
        assert indicadores["receita_mes"] >= 36.0
        assert "ultimas_movimentacoes" in data


class TestRBACPermissoes:
    """
    Testes de segurança: verificar que bartenders NÃO podem
    acessar rotas de admin/gerente.
    """

    def test_bartender_nao_pode_criar_insumo(self, client, bartender_token):
        """Bartender não pode criar insumos."""
        response = client.post(
            "/api/v1/estoque/insumos",
            headers={"Authorization": f"Bearer {bartender_token}"},
            json={
                "nome": "Teste Bartender",
                "categoria": "Teste",
                "unidade_medida": "un",
                "custo_unitario": 1.0,
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bartender_nao_pode_entrada_mercadoria(self, client, bartender_token, seed_insumos):
        """Bartender não pode registrar entrada de mercadoria."""
        insumo = seed_insumos["Cachaça Teste"]
        response = client.post(
            "/api/v1/estoque/entrada",
            headers={"Authorization": f"Bearer {bartender_token}"},
            json={
                "insumo_id": insumo.id,
                "tipo": "COMPRA",
                "quantidade": 100,
                "custo_no_momento": 0.05,
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_bartender_pode_vender(self, client, bartender_token, seed_produtos):
        """Bartender pode realizar vendas (é sua função)."""
        produto = seed_produtos["produto"]
        response = client.post(
            f"/api/v1/pdv/vender?produto_id={produto.id}&quantidade=1&imprimir_comanda=false",
            headers={"Authorization": f"Bearer {bartender_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["sucesso"] is True

    def test_bartender_pode_ver_produtos(self, client, bartender_token, seed_produtos):
        """Bartender pode ver lista de produtos (PDV)."""
        response = client.get(
            "/api/v1/pdv/produtos",
            headers={"Authorization": f"Bearer {bartender_token}"},
        )
        assert response.status_code == status.HTTP_200_OK

    def test_bartender_nao_pode_ver_auditoria(self, client, bartender_token):
        """Bartender não pode ver logs de auditoria."""
        response = client.get(
            "/api/v1/relatorios/auditoria",
            headers={"Authorization": f"Bearer {bartender_token}"},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
