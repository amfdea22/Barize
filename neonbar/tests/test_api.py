"""
BARIZE - Testes de API (Rotas)
Pilar 2: Endpoints REST
Pilar 5: RBAC e Segurança
"""

import pytest
from fastapi import status


class TestAuthAPI:
    """Testes das rotas de autenticação."""

    def test_login_sucesso(self, client, admin_token):
        """Login com credenciais válidas deve retornar token."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin_test", "senha": "Teste1234"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["usuario"]["username"] == "admin_test"

    def test_login_senha_errada(self, client):
        """Login com senha errada deve retornar 401."""
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "admin_test", "senha": "senha_errada"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_me_sem_token(self, client):
        """Requisição sem token deve retornar 401 (ou 403 dependendo da versão)."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_me_com_token(self, client, admin_token):
        """Requisição com token deve retornar dados do usuário."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["username"] == "admin_test"

    def test_criar_usuario_admin(self, client, admin_token):
        """Admin pode criar novos usuários."""
        response = client.post(
            "/api/v1/auth/usuarios",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nome": "Novo Usuário",
                "email": "novo@bar.com",
                "username": "novouser",
                "senha": "Senha1234",
                "role": "bartender",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["username"] == "novouser"

    def test_criar_usuario_bartender_negado(self, client, bartender_token):
        """Bartender não pode criar usuários."""
        response = client.post(
            "/api/v1/auth/usuarios",
            headers={"Authorization": f"Bearer {bartender_token}"},
            json={
                "nome": "Não Pode",
                "email": "nao@pode.com",
                "username": "naopode",
                "senha": "Senha1234",
                "role": "bartender",
            },
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestPDVAPI:
    """Testes das rotas do PDV."""

    def test_listar_produtos(self, client, admin_token, seed_produtos):
        """Listagem de produtos deve retornar itens ativos."""
        response = client.get(
            "/api/v1/pdv/produtos",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1
        assert any(p["nome"] == "Caipirinha Teste" for p in data)

    def test_vender_produto(self, client, admin_token, seed_produtos):
        """Venda de produto deve registrar e baixar estoque."""
        produto = seed_produtos["produto"]
        
        response = client.post(
            f"/api/v1/pdv/vender?produto_id={produto.id}&quantidade=1&imprimir_comanda=false",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["sucesso"] is True
        assert data["produto"] == "Caipirinha Teste"
        assert data["valor_total"] == 18.0

    def test_vender_sem_estoque(self, client, admin_token, seed_produtos):
        """Venda com quantidade grande deve retornar 400 por estoque insuficiente."""
        produto = seed_produtos["produto"]
        
        # Tenta vender uma quantidade grande que deve exceder o estoque
        response = client.post(
            f"/api/v1/pdv/vender?produto_id={produto.id}&quantidade=999&imprimir_comanda=false",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        # Deve falhar por falta de estoque
        assert response.status_code == status.HTTP_400_BAD_REQUEST


class TestEstoqueAPI:
    """Testes das rotas de estoque."""

    def test_listar_insumos(self, client, admin_token, seed_insumos):
        """Listagem de insumos deve retornar todos."""
        response = client.get(
            "/api/v1/estoque/insumos",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 3

    def test_criar_insumo(self, client, admin_token):
        """Criação de insumo deve funcionar."""
        response = client.post(
            "/api/v1/estoque/insumos",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nome": "Insumo Teste API",
                "categoria": "Bebida",
                "unidade_medida": "ml",
                "estoque_atual": 1000,
                "estoque_minimo": 100,
                "custo_unitario": 1.50,
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["nome"] == "Insumo Teste API"

    def test_entrada_mercadoria(self, client, admin_token, seed_insumos):
        """Entrada de mercadoria via API."""
        insumo = seed_insumos["Cachaça Teste"]
        
        response = client.post(
            "/api/v1/estoque/entrada",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "insumo_id": insumo.id,
                "tipo": "COMPRA",
                "quantidade": 500,
                "custo_no_momento": 0.05,
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["sucesso"] is True

    def test_insumos_baixo_estoque(self, client, admin_token):
        """Rota de insumos críticos deve funcionar."""
        response = client.get(
            "/api/v1/estoque/insumos-baixo-estoque",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.json(), list)


class TestCMVAPI:
    """Testes das rotas de CMV."""

    def test_calcular_cmv(self, client, admin_token):
        """Cálculo de CMV via API deve retornar métricas."""
        response = client.get(
            "/api/v1/cmv/calcular?dias=30",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "custo_total" in data
        assert "receita_total" in data
        assert "cmv_percentual" in data
        assert "periodo" in data

    def test_dashboard(self, client, admin_token):
        """Dashboard financeiro deve retornar indicadores."""
        response = client.get(
            "/api/v1/cmv/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "receita_dia" in data
        assert "cmv_mes" in data


class TestCaixaAPI:
    """Testes das rotas de caixa."""

    def test_abrir_caixa_api(self, client, admin_token):
        """Abertura de caixa via API."""
        response = client.post(
            "/api/v1/caixa/abrir",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"usuario_id": 1, "saldo_inicial": 100.0},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["sucesso"] is True

    def test_caixa_aberto(self, client, admin_token):
        """Rota de verificação de caixa aberto."""
        response = client.get(
            "/api/v1/caixa/aberto",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK


class TestRelatoriosAPI:
    """Testes das rotas de relatórios."""

    def test_dashboard_executivo(self, client, admin_token):
        """Dashboard executivo deve retornar indicadores."""
        response = client.get(
            "/api/v1/relatorios/dashboard-executivo",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "indicadores" in data


class TestHealthAPI:
    """Testes das rotas de health check."""

    def test_health_root(self, client):
        """Rota raiz deve retornar informações do serviço."""
        response = client.get("/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["servico"] == "BARIZE"

    def test_health_check(self, client):
        """Health check deve retornar status ok."""
        response = client.get("/api/v1/admin/health")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "ok"
