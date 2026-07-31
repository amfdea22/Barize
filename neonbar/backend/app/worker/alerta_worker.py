"""
BARIZE - Worker de Alertas
Pilar 6: Operacional - Sistema de Alertas Automatizado

Worker independente que verifica periodicamente condições de alerta
(estoque mínimo, vendas atípicas) e dispara notificações.
"""

import time
from loguru import logger

from ..database import SessionLocal
from ..services.alerta_service import AlertaService
from ..config import get_settings

settings = get_settings()


class AlertaWorker:
    """
    Worker que verifica condições de alerta periodicamente.
    """

    def __init__(self):
        self.running = True

    def iniciar(self):
        """Loop principal do worker de alertas."""
        logger.info("[ALERTA-WORKER] Iniciando...")

        while self.running:
            try:
                db = SessionLocal()
                try:
                    service = AlertaService(db)
                    alertas = service.verificar_estoque_minimo()

                    if alertas:
                        logger.info(f"[ALERTA-WORKER] {len(alertas)} alerta(s) disparado(s)")
                    else:
                        logger.debug("[ALERTA-WORKER] Nenhum alerta necessário")

                finally:
                    db.close()

                time.sleep(settings.ALERTA_POLL_INTERVAL_SECONDS)

            except KeyboardInterrupt:
                logger.info("[ALERTA-WORKER] Interrompido")
                self.running = False
            except Exception as e:
                logger.error(f"[ALERTA-WORKER] Erro: {e}")
                time.sleep(60)

    def parar(self):
        self.running = False


if __name__ == "__main__":
    worker = AlertaWorker()
    worker.iniciar()
