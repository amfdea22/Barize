"""
BARIZE - Worker de Impressão ESC/POS
Pilar 4: Integração de Hardware - Service Worker + Fila de Impressão + Monitoramento

Este worker roda como um processo independente (Docker service ou systemd).
Ele:
1. Monitora a tabela `fila_impressao` por novos trabalhos PENDENTES
2. Formata o conteúdo em ESC/POS (layout profissional de comanda)
3. Envia para a impressora térmica
4. Atualiza o status para CONCLUIDO ou ERRO
5. Tentativas automáticas em caso de falha
"""

import time
import json
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session
from loguru import logger

from ..database import SessionLocal
from ..models.fila_impressao import FilaImpressao
from ..config import get_settings

settings = get_settings()

try:
    from escpos.printer import Network, Serial, Usb
    ESCPOS_AVAILABLE = True
except ImportError:
    ESCPOS_AVAILABLE = False
    logger.warning("[WORKER] python-escpos não disponível. Modo simulação.")


class ImpressaoWorker:
    """
    Worker que processa a fila de impressão de comandas.
    Roda em loop infinito, ideal para Docker ou systemd.
    """

    def __init__(self, printer_host: Optional[str] = None, printer_port: int = 9100):
        self.printer_host = printer_host
        self.printer_port = printer_port
        self.printer = None
        self.running = True

    def conectar_impressora(self) -> bool:
        """
        Conecta à impressora térmica via rede (ESC/POS).
        Retorna True se conectou com sucesso.
        """
        if not ESCPOS_AVAILABLE:
            logger.info("[WORKER] ESC/POS não disponível. Usando modo simulação.")
            return True

        try:
            if self.printer_host:
                # Impressora em rede (Ethernet/WiFi)
                self.printer = Network(self.printer_host, self.printer_port)
                logger.info(f"[WORKER] Impressora conectada: {self.printer_host}:{self.printer_port}")
            else:
                # USB (procurar automaticamente)
                self.printer = Usb()
                logger.info("[WORKER] Impressora USB conectada")

            # Teste de comunicação
            self.printer.text("BARIZE - Printer OK\n")
            self.printer.cut()
            return True

        except Exception as e:
            logger.error(f"[WORKER] Falha ao conectar impressora: {e}")
            self.printer = None
            return False

    def verificar_impressora_online(self) -> bool:
        """
        Verifica se a impressora está online antes de enviar.
        Pilar 4: Monitoramento de Impressora
        """
        if not ESCPOS_AVAILABLE:
            return True

        try:
            if self.printer:
                # Tenta comando de status
                self.printer._raw(b"\x10\x04\x01")  # DLE EOT status
                return True
            return False
        except Exception:
            logger.warning("[WORKER] Impressora offline!")
            return False

    def formatar_comanda_escpos(self, dados: dict) -> bytes:
        """
        Formata o layout da comanda no formato ESC/POS.
        Pilar 4: Formatação ESC/POS com logo, itens, valor, data

        Layout:
        ┌─────────────────────┐
        │     ★ NEONBAR ★      │
        │   Comanda de Bar     │
        ├─────────────────────┤
        │ Item: Caipirinha    │
        │ Qtd: 2              │
        │ R$ 18,00           │
        ├─────────────────────┤
        │ Total: R$ 36,00    │
        │ Atendente: João    │
        │ 16/07/2026 19:30   │
        └─────────────────────┘
        """
        if not ESCPOS_AVAILABLE:
            # Modo simulação: retorna texto formatado
            return self._formatar_comanda_texto(dados).encode("utf-8")

        from escpos.constants import ESC, LF, GS

        linhas = []

        # Cabeçalho
        linhas.append(b"\x1b\x61\x01")  # Centralizar
        linhas.append(b"\x1d\x21\x11")  # Tamanho duplo
        linhas.append(b"NEONBAR\n")
        linhas.append(b"\x1d\x21\x00")  # Tamanho normal
        linhas.append(b"Comanda de Bar\n")
        linhas.append(b"\x1d\x21\x01")  # Tamanho médio
        linhas.append(b"=" * 32 + b"\n")
        linhas.append(b"\x1d\x21\x00")

        # Itens
        linhas.append(b"\x1b\x61\x00")  # Alinhar à esquerda
        produto = dados.get("produto", "Produto").encode("utf-8")
        quantidade = dados.get("quantidade", 1)
        preco_unitario = dados.get("preco_unitario", 0.0)
        preco_total = dados.get("preco_total", 0.0)

        linhas.append(f"Item: {produto}\n".encode("utf-8"))
        linhas.append(f"Qtd:  {quantidade}\n".encode("utf-8"))

        linhas.append(b"\x1b\x61\x02")  # Alinhar à direita
        linhas.append(f"R$ {preco_unitario:.2f}\n".encode("utf-8"))

        # Total
        linhas.append(b"\x1b\x61\x01")  # Centralizar
        linhas.append(b"-" * 32 + b"\n")
        linhas.append(b"\x1d\x21\x01")  # Tamanho médio
        linhas.append(f"Total: R$ {preco_total:.2f}\n".encode("utf-8"))
        linhas.append(b"\x1d\x21\x00")  # Tamanho normal

        # Rodapé
        linhas.append(b"\x1b\x61\x00")
        atendente = dados.get("atendente", "Sistema").encode("utf-8")
        linhas.append(f"Atendente: {atendente}\n".encode("utf-8"))
        linhas.append(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}\n".encode("utf-8"))
        linhas.append(b"\n")
        linhas.append(b"\x1b\x61\x01")
        linhas.append(b"Obrigado!\n")
        linhas.append(b"\n\n\n")

        # Cortar papel
        linhas.append(b"\x1d\x56\x00")  # Cut

        return b"".join(linhas)

    def _formatar_comanda_texto(self, dados: dict) -> str:
        """Formata comanda em texto simples (modo simulação)."""
        produto = dados.get("produto", "Produto")
        quantidade = dados.get("quantidade", 1)
        preco_unitario = dados.get("preco_unitario", 0.0)
        preco_total = dados.get("preco_total", 0.0)
        atendente = dados.get("atendente", "Sistema")

        linhas = []
        linhas.append("=" * 32)
        linhas.append("        ★ NEONBAR ★")
        linhas.append("     Comanda de Bar")
        linhas.append("=" * 32)
        linhas.append("")
        linhas.append(f"  Item: {produto}")
        linhas.append(f"  Qtd:  {quantidade}")
        linhas.append(f"  R$   {preco_unitario:.2f}  ")
        linhas.append("-" * 32)
        linhas.append(f"  Total: R$ {preco_total:.2f}")
        linhas.append("")
        linhas.append(f"  Atendente: {atendente}")
        linhas.append(f"  {datetime.now().strftime('%d/%m/%Y %H:%M')}")
        linhas.append("")
        linhas.append("       Obrigado!")
        linhas.append("=" * 32)
        linhas.append("")
        return "\n".join(linhas)

    def processar_fila(self):
        """
        Lê a fila de impressão e processa os trabalhos pendentes.
        """
        db: Session = SessionLocal()

        try:
            trabalhos = (
                db.query(FilaImpressao)
                .filter(FilaImpressao.status == "PENDENTE")
                .order_by(FilaImpressao.created_at.asc())
                .limit(10)
                .all()
            )

            for trabalho in trabalhos:
                # Marca como imprimindo
                trabalho.status = "IMPRIMINDO"
                db.commit()

                try:
                    # Verifica impressora
                    if not self.verificar_impressora_online():
                        # Tenta reconectar
                        if not self.conectar_impressora():
                            raise ConnectionError("Impressora offline após tentativa de reconexão")

                    # Formata e imprime
                    dados = trabalho.dados_json
                    comanda_formatada = self.formatar_comanda_escpos(dados)

                    if ESCPOS_AVAILABLE and self.printer:
                        self.printer._raw(comanda_formatada)
                    else:
                        logger.info(f"[WORKER] Simulação de impressão:\n{comanda_formatada.decode('utf-8', errors='ignore')}")

                    # Marca como concluído
                    trabalho.status = "CONCLUIDO"
                    db.commit()

                    logger.info(
                        f"[WORKER] Comanda #{trabalho.id} impressa: "
                        f"{dados.get('quantidade', '?')}x '{dados.get('produto', '?')}'"
                    )

                except Exception as e:
                    trabalho.tentativas += 1
                    trabalho.erro_msg = str(e)
                    if trabalho.tentativas >= 3:
                        trabalho.status = "ERRO"
                        logger.error(f"[WORKER] Comanda #{trabalho.id} falhou após 3 tentativas: {e}")
                    else:
                        trabalho.status = "PENDENTE"
                        logger.warning(f"[WORKER] Comanda #{trabalho.id} erro (tentativa {trabalho.tentativas}): {e}")
                    db.commit()

        except Exception as e:
            logger.error(f"[WORKER] Erro ao processar fila: {e}")
        finally:
            db.close()

    def iniciar(self):
        """
        Inicia o worker em loop infinito.
        Para ser usado como entrypoint do container.
        """
        logger.info("[WORKER] Iniciando Worker de Impressão BARIZE...")

        # Tenta conectar impressora
        self.conectar_impressora()

        while self.running:
            try:
                self.processar_fila()
                time.sleep(settings.PRINT_POLL_INTERVAL_SECONDS)
            except KeyboardInterrupt:
                logger.info("[WORKER] Worker interrompido pelo usuário")
                self.running = False
            except Exception as e:
                logger.error(f"[WORKER] Erro no loop principal: {e}")
                time.sleep(10)

        logger.info("[WORKER] Worker finalizado")

    def parar(self):
        """Para o worker gracefulmente."""
        self.running = False


# ─── Entrypoint ─────────────────────────────────────────────

if __name__ == "__main__":
    worker = ImpressaoWorker()
    worker.iniciar()
