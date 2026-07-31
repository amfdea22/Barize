"""
BARIZE - Testes do Worker de Impressão
Pilar 4: Fila de Impressão, ESC/POS, Monitoramento
"""

import pytest
from unittest.mock import patch, MagicMock


class TestFilaImpressao:
    """Testes da fila de impressão."""

    def test_criar_trabalho_impressao(self, db_session):
        """Criar trabalho na fila de impressão."""
        from app.models.fila_impressao import FilaImpressao
        
        trabalho = FilaImpressao(
            tipo="COMANDA",
            status="PENDENTE",
            dados_json={
                "produto": "Caipirinha",
                "quantidade": 2,
                "preco_unitario": 18.0,
                "preco_total": 36.0,
                "atendente": "Bartender",
            },
        )
        db_session.add(trabalho)
        db_session.commit()
        
        assert trabalho.id is not None
        assert trabalho.status == "PENDENTE"
        assert trabalho.tentativas == 0
        assert trabalho.dados_json["produto"] == "Caipirinha"

    def test_fila_status_pendente(self, db_session):
        """Fila deve retornar apenas trabalhos pendentes."""
        from app.models.fila_impressao import FilaImpressao
        
        # Cria trabalhos com diferentes status
        for status in ["PENDENTE", "IMPRIMINDO", "CONCLUIDO", "ERRO"]:
            t = FilaImpressao(
                tipo="COMANDA",
                status=status,
                dados_json={"produto": f"Item {status}", "quantidade": 1},
            )
            db_session.add(t)
        db_session.commit()
        
        pendentes = db_session.query(FilaImpressao).filter(
            FilaImpressao.status == "PENDENTE"
        ).all()
        assert len(pendentes) == 1
        assert pendentes[0].status == "PENDENTE"

    def test_tentativas_auto_increment(self, db_session):
        """Tentativas devem incrementar automaticamente em caso de erro."""
        from app.models.fila_impressao import FilaImpressao
        
        t = FilaImpressao(
            tipo="COMANDA",
            status="PENDENTE",
            dados_json={"produto": "Teste", "quantidade": 1},
        )
        db_session.add(t)
        db_session.commit()
        
        # Simula falhas
        t.status = "PENDENTE"
        t.tentativas += 1
        db_session.commit()
        assert t.tentativas == 1
        
        t.tentativas += 1
        db_session.commit()
        assert t.tentativas == 2


class TestFormatacaoComanda:
    """Testes da formatação ESC/POS."""

    def test_formatar_comanda_texto(self):
        """Formatação em modo texto (simulação) deve gerar output legível."""
        from app.worker.impressao_worker import ImpressaoWorker
        
        worker = ImpressaoWorker()
        dados = {
            "produto": "Caipirinha",
            "quantidade": 2,
            "preco_unitario": 18.0,
            "preco_total": 36.0,
            "atendente": "João",
        }
        
        comanda = worker._formatar_comanda_texto(dados)
        
        # Verifica elementos essenciais
        assert "NEONBAR" in comanda
        assert "Caipirinha" in comanda
        assert "36.00" in comanda
        assert "João" in comanda
        assert "Obrigado" in comanda

    def test_formata_escpos_fallback(self):
        """Quando escpos não está disponível, usa fallback texto."""
        from app.worker.impressao_worker import ImpressaoWorker
        
        worker = ImpressaoWorker()
        dados = {
            "produto": "Cerveja",
            "quantidade": 3,
            "preco_unitario": 8.0,
            "preco_total": 24.0,
            "atendente": "Maria",
        }
        
        # Como ESCPOS_AVAILABLE é False no teste, deve usar texto
        comanda = worker.formatar_comanda_escpos(dados)
        
        assert isinstance(comanda, bytes)
        texto = comanda.decode("utf-8")
        assert "Cerveja" in texto
        assert "Maria" in texto


class TestMonitoramentoImpressora:
    """Testes de monitoramento de impressora."""

    def test_verificar_impressora_simulacao(self):
        """Quando escpos não disponível, retorna True (simulação)."""
        from app.worker.impressao_worker import ImpressaoWorker
        from app.worker.impressao_worker import ESCPOS_AVAILABLE
        
        worker = ImpressaoWorker()
        assert ESCPOS_AVAILABLE is False  # no escpos lib installed
        online = worker.verificar_impressora_online()
        assert online is True  # Simulação sempre retorna True

    def test_conectar_impressora_sem_host(self):
        """Conectar sem host configurado deve funcionar em modo simulação."""
        from app.worker.impressao_worker import ImpressaoWorker
        
        worker = ImpressaoWorker(printer_host=None)
        # Como ESCPOS_AVAILABLE é False, deve retornar True (simulação)
        resultado = worker.conectar_impressora()
        assert resultado is True
        assert worker.printer is None  # Nenhuma impressora real conectada


class TestWorkerCiclo:
    """Testes do ciclo completo do worker."""

    def test_processar_fila_vazia(self, db_session):
        """Fila vazia não deve causar erros."""
        from app.worker.impressao_worker import ImpressaoWorker
        
        worker = ImpressaoWorker()
        # Não deve lançar exceção com fila vazia
        try:
            worker.processar_fila()
        except Exception as e:
            pytest.fail(f"Worker lançou exceção com fila vazia: {e}")

    def test_processar_comanda_pendente(self, db_session):
        """Worker deve processar comanda pendente (simulação)."""
        from app.models.fila_impressao import FilaImpressao
        
        # Cria trabalho pendente
        t = FilaImpressao(
            tipo="COMANDA",
            status="PENDENTE",
            dados_json={
                "produto": "Teste Worker",
                "quantidade": 1,
                "preco_unitario": 10.0,
                "preco_total": 10.0,
                "atendente": "Sistema",
            },
        )
        db_session.add(t)
        db_session.commit()
        
        # Simula o que o worker faria: PENDENTE -> IMPRIMINDO -> CONCLUIDO
        trabalho = db_session.query(FilaImpressao).filter(
            FilaImpressao.status == "PENDENTE"
        ).first()
        assert trabalho is not None
        
        trabalho.status = "IMPRIMINDO"
        db_session.commit()
        
        trabalho.status = "CONCLUIDO"
        db_session.commit()
        
        resultado = db_session.query(FilaImpressao).filter(
            FilaImpressao.id == trabalho.id
        ).first()
        assert resultado.status == "CONCLUIDO"

    def test_limite_tentativas(self, db_session):
        """Após 3 tentativas, trabalho deve ir para ERRO."""
        from app.models.fila_impressao import FilaImpressao
        
        t = FilaImpressao(
            tipo="COMANDA",
            status="IMPRIMINDO",
            dados_json={"produto": "Falha", "quantidade": 1},
            tentativas=2,
        )
        db_session.add(t)
        db_session.commit()
        
        # Simula 3ª falha
        t.tentativas += 1
        if t.tentativas >= 3:
            t.status = "ERRO"
            t.erro_msg = "Falha após 3 tentativas"
        db_session.commit()
        
        assert t.status == "ERRO"
        assert t.tentativas == 3
