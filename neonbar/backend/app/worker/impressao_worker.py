"""
BARIZE - Worker de Impressão ESC/POS
Pilar 4: Integração de Hardware - Service Worker + Fila de Impressão + Monitoramento

Este worker roda como um processo independente (Docker service ou systemd).
Ele:
1. Monitora a tabela `fila_impressao` por novos trabalhos PENDENTES
2. Resolve a impressora de cada trabalho pelo setor (printer_config do banco)
3. Formata o conteúdo em ESC/POS conforme o tipo de documento:
   - COMANDA (produção cozinha/bar): título destacado, itens em negrito, SEM preços
   - FECHAMENTO (pré-conta/total): valores justificados, total em destaque
4. Envia para a impressora térmica do setor
5. Atualiza o status para CONCLUIDO ou ERRO
6. Tentativas automáticas em caso de falha
"""

import time
from typing import Optional
from datetime import datetime

from sqlalchemy.orm import Session
from loguru import logger

from ..database import SessionLocal
from ..models.fila_impressao import FilaImpressao
from ..models.printer_config import PrinterConfig
from ..config import get_settings

settings = get_settings()

try:
    from escpos.printer import Network, Usb
    ESCPOS_AVAILABLE = True
except ImportError:
    ESCPOS_AVAILABLE = False
    logger.warning("[WORKER] python-escpos não disponível. Modo simulação.")

# Largura da bobina de 80mm (Fonte Tipo A)
COLUNAS = 48
LINHA = "=" * COLUNAS
TRACO = "-" * COLUNAS

# Comandos DLE EOT (leitura de status da impressora ESC/POS)
DLE_EOT_PRINTER = b"\x10\x04\x01"  # printer status
DLE_EOT_OFFLINE = b"\x10\x04\x02"  # offline status
DLE_EOT_ERROR = b"\x10\x04\x03"    # error status
DLE_EOT_PAPER = b"\x10\x04\x04"    # paper roll sensor


def interpretar_dle_eot(offline_byte: int, papel_byte: int) -> dict:
    """
    Interpreta os bytes de resposta do DLE EOT 2 (offline) e DLE EOT 4 (papel).

    DLE EOT 2 (offline status):
      bit0 (0x01) printer offline | bit1 (0x02) tampa aberta
      bit2 (0x04) botão feed | bit4 (0x10) erro mecânico (guilhotina)
      bit6 (0x40) recovery

    DLE EOT 4 (paper roll sensor):
      bit0 (0x01) near-end (papel baixo) | bit1 (0x02) end (papel esgotado)
      bit4 (0x10) near-end enable | bit5 (0x20) end enable

    Retorna dict de status com flags e razão legível.
    """
    offline = bool(offline_byte & 0x01)
    tampa_aberta = bool(offline_byte & 0x02)
    erro_mecanico = bool(offline_byte & 0x10)
    recovery = bool(offline_byte & 0x40)
    papel_baixo = bool(papel_byte & 0x01)
    papel_esgotado = bool(papel_byte & 0x02)

    razoes = []
    if offline:
        razoes.append("impressora offline/desligada")
    if tampa_aberta:
        razoes.append("tampa superior aberta")
    if papel_esgotado:
        razoes.append("papel esgotado")
    if erro_mecanico:
        razoes.append("erro mecânico (guilhotina travada)")
    if recovery:
        razoes.append("estado de recuperação ativo")

    # Impressora indisponível se offline OU tampa aberta OU papel esgotado OU erro mecânico
    disponivel = not (offline or tampa_aberta or papel_esgotado or erro_mecanico)

    return {
        "online": disponivel,
        "tampa_aberta": tampa_aberta,
        "papel_esgotado": papel_esgotado,
        "papel_baixo": papel_baixo,
        "erro_mecanico": erro_mecanico,
        "recovery": recovery,
        "offline_razao": ", ".join(razoes) if razoes else None,
    }


# ─── PIX / QR Code ESC/POS ─────────────────────────────────

# Comando de abertura de gaveta via pulso na porta RJ11 (ESC p m t1 t2)
# m=0 (pulso na pino 2), t1=19 (49ms*2), t2=250 (tipo 2) → padrão Epson
ABRIR_GAVETA = b"\x1b\x70\x00\x19\xfa"


def _crc16_ccitt(dados: bytes) -> int:
    """CRC-16/CCITT (polinômio 0x1021) usado no payload PIX (BR Code EMV)."""
    crc = 0xFFFF
    for byte in dados:
        crc ^= byte << 8
        for _ in range(8):
            crc = ((crc << 1) ^ 0x1021) if crc & 0x8000 else (crc << 1)
            crc &= 0xFFFF
    return crc


def _tlv(id: str, valor: str) -> str:
    """Monta um campo TLV do BR Code: ID(2) + Tamanho(2) + Valor."""
    if isinstance(valor, str):
        valor = valor.encode("utf-8").decode("latin-1")
    return f"{id}{len(valor.encode('latin-1')):02d}{valor}"


def gerar_payload_pix(
    chave: str,
    nome: str = "BARIZE",
    cidade: str = "SAO PAULO",
    valor: float = 0.0,
    txid: str = "***",
) -> str:
    """
    Gera um payload PIX (BR Code estático) conforme spec do Bacen.
    Utilizado para imprimir o QR Code no cupom ESC/POS e na UI.
    """
    chave = (chave or "").strip()
    if not chave:
        return ""
    if not txid or txid in ("***", ""):
        txid = "***"

    gui = _tlv("00", "br.gov.bcb.pix")
    chave_tlv = _tlv("01", chave)
    merchant_account = _tlv("26", gui + chave_tlv)

    payload = (
        _tlv("00", "01")
        + merchant_account
        + _tlv("52", "0000")
        + _tlv("53", "986")
    )
    if valor and valor > 0:
        payload += _tlv("54", f"{valor:.2f}")
    payload += (
        _tlv("58", "BR")
        + _tlv("59", (nome or "").strip()[:25].upper())
        + _tlv("60", (cidade or "").strip()[:15].upper())
        + _tlv("62", _tlv("05", txid))
    )

    payload += "6304"
    crc = _crc16_ccitt(payload.encode("latin-1"))
    payload += f"{crc:04X}"
    return payload


def formatar_qr_escpos(payload: str, modulo: int = 6) -> bytes:
    """
    Gera o comando ESC/POS para imprimir um QR Code nativo (GS ( k).
    Não suportado em modo simulação — retorna representação textual.
    """
    if not payload:
        return b""

    dados = payload.encode("latin-1", errors="replace")

    # GS ( k 4 0 49 69 0 → Modelo 2 (padrão)
    cmd_modelo = b"\x1d\x28\x6b\x04\x00\x31\x43\x04"
    # GS ( k 3 0 49 67 n → Tamanho do módulo
    cmd_modulo = b"\x1d\x28\x6b\x03\x00\x31\x43" + bytes([modulo])
    # GS ( k pl ph 49 81 n → Store data
    n = len(dados)
    pL = n + 3
    p1 = pL % 256
    p2 = pL // 256
    cmd_dados = b"\x1d\x28\x6b" + bytes([p1, p2]) + b"\x31\x50\x30" + dados
    # GS ( k 3 0 49 81 48 → Print QR
    cmd_print = b"\x1d\x28\x6b\x03\x00\x31\x51\x30"

    return cmd_modelo + cmd_modulo + cmd_dados + cmd_print


class ImpressaoWorker:
    """
    Worker que processa a fila de impressão de comandas.
    Roda em loop infinito, ideal para Docker ou systemd.
    """

    def __init__(self, printer_host: Optional[str] = None, printer_port: int = 9100):
        # Override opcional de impressora única (mantém compatibilidade).
        # Se None, a configuração é resolvida do banco por setor.
        self.printer_host = printer_host
        self.printer_port = printer_port
        self.printer = None
        self._config_atual = None
        self.running = True

    # ─── Resolução de config por setor ────────────────────────────

    def resolve_config_setor(self, db: Session, setor: str) -> Optional[PrinterConfig]:
        """
        Retorna a config ATIVA da impressora de um setor (CAIXA/COZINHA/BAR).
        Se setor vazio → CAIXA. Se não existir config ativa para o setor,
        retorna a primeira config ativa existente como fallback.
        """
        setor = (setor or "CAIXA").upper()
        config = (
            db.query(PrinterConfig)
            .filter(PrinterConfig.setor == setor, PrinterConfig.ativo == True)  # noqa: E712
            .first()
        )
        if not config:
            config = (
                db.query(PrinterConfig)
                .filter(PrinterConfig.ativo == True)  # noqa: E712
                .order_by(PrinterConfig.id.asc())
                .first()
            )
        return config

    # ─── Conexão ──────────────────────────────────────────────────

    def conectar_impressora(self, config: Optional[PrinterConfig] = None) -> bool:
        """
        Conecta à impressora térmica. Usa a config do banco por setor.
        Impressora em rede (Network host:porta) é o caminho padrão.
        Retorna True se conectou com sucesso.
        """
        if not ESCPOS_AVAILABLE:
            logger.info("[WORKER] ESC/POS não disponível. Usando modo simulação.")
            return True

        try:
            host = config.host if config else None
            porta = config.porta if config and config.porta else 9100

            if host:
                self.printer = Network(host, porta)
                logger.info(f"[WORKER] Impressora conectada: {host}:{porta}")
            else:
                # Sem host configurado → não tenta USB cego; sinaliza erro claro
                logger.error("[WORKER] Impressora do setor sem host configurado (network não definida).")
                self.printer = None
                return False

            # Teste de comunicação
            self.printer.text("BARIZE - Printer OK\n")
            self.printer.cut()
            return True

        except Exception as e:
            logger.error(f"[WORKER] Falha ao conectar impressora: {e}")
            self.printer = None
            return False

    def _ler_dle_eot(self, comando: bytes) -> Optional[int]:
        """
        Envia um comando DLE EOT e lê a resposta de 1 byte da socket.
        Retorna o byte lido ou None em timeout/erro (impressora offline).
        """
        if not self.printer:
            return None
        try:
            device = self.printer.device
            device.settimeout(0.5)
            device.send(comando)
            resposta = device.recv(1)
            if len(resposta) == 1:
                return resposta[0]
            return None
        except Exception:
            return None

    def verificar_impressora_detalhada(self) -> dict:
        """
        Verifica o status físico da impressora via DLE EOT 2 (offline) e
        DLE EOT 4 (sensor de papel), lendo as respostas.
        Retorna o dict de interpretar_dle_eot; em modo simulação retorna
        online=True sem erros.
        """
        if not ESCPOS_AVAILABLE or not self.printer:
            return {
                "online": True,
                "tampa_aberta": False,
                "papel_esgotado": False,
                "papel_baixo": False,
                "erro_mecanico": False,
                "recovery": False,
                "offline_razao": None,
            }

        offline_byte = self._ler_dle_eot(DLE_EOT_OFFLINE)
        if offline_byte is None:
            return {
                "online": False,
                "tampa_aberta": False,
                "papel_esgotado": False,
                "papel_baixo": False,
                "erro_mecanico": False,
                "recovery": False,
                "offline_razao": "impressora offline/desligada (sem resposta DLE EOT)",
            }

        papel_byte = self._ler_dle_eot(DLE_EOT_PAPER)
        if papel_byte is None:
            papel_byte = 0x00

        return interpretar_dle_eot(offline_byte, papel_byte)

    def verificar_impressora_online(self) -> bool:
        """
        Verifica se a impressora está online antes de enviar.
        Pilar 4: Monitoramento de Impressora
        """
        if not ESCPOS_AVAILABLE:
            return True

        try:
            if self.printer:
                status = self.verificar_impressora_detalhada()
                if not status["online"]:
                    logger.warning(f"[WORKER] Impressora offline: {status['offline_razao']}")
                return status["online"]
            return False
        except Exception:
            logger.warning("[WORKER] Impressora offline!")
            return False

    # ─── Formatação ESC/POS ───────────────────────────────────────

    @staticmethod
    def _centralizar(texto: str, colunas: int = COLUNAS) -> str:
        """Centraliza um texto dentro de N colunas (modo texto/simulação)."""
        texto = texto.strip()
        if len(texto) >= colunas:
            return texto
        espacos = (colunas - len(texto)) // 2
        return " " * espacos + texto

    @staticmethod
    def _justificar(qtd_nome: str, valor: str, colunas: int = COLUNAS) -> str:
        """
        Alinhamento justificado: quantidade + nome à esquerda, valor à direita.
        Preenche os espaços vazios entre eles até completar a largura da bobina.
        """
        qtd_nome = qtd_nome.strip()
        valor = valor.strip()
        if len(qtd_nome) + len(valor) >= colunas:
            return (qtd_nome + " " + valor)[:colunas]
        return qtd_nome + " " * (colunas - len(qtd_nome) - len(valor)) + valor

    def formatar_comanda_escpos(self, dados: dict) -> bytes:
        """
        Comanda de produção (cozinha/bar).
        Título FONT_LARGE, itens em negrito com quantidade, SEM preços,
        observação em destaque.
        """
        if not ESCPOS_AVAILABLE:
            return self._formatar_comanda_texto(dados).encode("utf-8")

        from escpos.constants import ESC, LF, GS

        linhas = []
        produto = dados.get("produto", "Produto")
        quantidade = dados.get("quantidade", 1)
        observacao = dados.get("observacao")

        # Cabeçalho centralizado com título duplo
        linhas.append(b"\x1b\x61\x01")  # Centralizar
        linhas.append(b"\x1d\x21\x11")  # Tamanho duplo (FONT_LARGE)
        linhas.append(b"BARIZE\n")
        linhas.append(b"\x1d\x21\x00")  # Tamanho normal
        linhas.append(b"* COMANDAS *\n")
        linhas.append(b"=" * 32 + b"\n")

        # Item em negrito com quantidade explícita (sem preços)
        linhas.append(b"\x1b\x61\x00")  # Alinhar à esquerda
        linhas.append(b"\x1b\x45\x01")  # Negrito ON
        linhas.append(f"{quantidade} x {produto}\n".encode("utf-8"))
        linhas.append(b"\x1b\x45\x00")  # Negrito OFF

        # Observação em destaque
        if observacao:
            linhas.append(b"\n")
            linhas.append(b"\x1b\x61\x01")  # Centralizar
            linhas.append(b"[ OBSERVACAO ]\n")
            linhas.append(b"\x1b\x45\x01")  # Negrito ON
            linhas.append(b"\x1b\x61\x00")  # Esquerda
            linhas.append(f"  {observacao}\n".encode("utf-8"))
            linhas.append(b"\x1b\x45\x00")  # Negrito OFF

        # Rodapé
        linhas.append(b"\n")
        linhas.append(b"\x1b\x61\x01")
        atendente = dados.get("atendente", "Sistema").encode("utf-8")
        linhas.append(f"Atendente: {atendente}\n".encode("utf-8"))
        linhas.append(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}\n".encode("utf-8"))
        linhas.append(b"\n\n\n")

        # Cortar papel (parcial)
        linhas.append(b"\x1d\x56\x01")  # Cut parcial

        return b"".join(linhas)

    def formatar_fechamento_escpos(self, dados: dict) -> bytes:
        """
        Nota de conferência / fechamento.
        Cabeçalho centralizado com mesa/cartão, itens justificados
        (qtd+nome à esquerda, valor à direita) e total em FONT_LARGE + negrito.
        """
        if not ESCPOS_AVAILABLE:
            return self._formatar_fechamento_texto(dados).encode("utf-8")

        from escpos.constants import ESC, LF, GS

        # Abertura de gaveta via pulso RJ11 (primeiro byte do buffer)
        linhas = [ABRIR_GAVETA]

        # Cabeçalho centralizado
        linhas.append(b"\x1b\x61\x01")  # Centralizar
        linhas.append(b"\x1d\x21\x11")  # FONT_LARGE
        linhas.append(b"BARIZE\n")
        linhas.append(b"\x1d\x21\x00")  # Normal
        mesa = dados.get("mesa", "MESA")
        cliente = dados.get("cliente", "")
        linhas.append(f"Conta {mesa}\n".encode("utf-8"))
        if cliente:
            linhas.append(f"Cliente: {cliente}\n".encode("utf-8"))
        linhas.append(b"=" * 32 + b"\n")

        # Itens justificados
        linhas.append(b"\x1b\x61\x00")  # Esquerda
        itens = dados.get("itens") or []
        for item in itens:
            qtd_nome = f"{item.get('quantidade', 1)}x {item.get('produto', '')}".strip()
            valor = f"R$ {item.get('preco_total', 0.0):.2f}"
            linha_escpos = qtd_nome + " " * (32 - len(qtd_nome) - len(valor)) + valor
            linhas.append(linha_escpos.encode("utf-8"))
        linhas.append(b"-" * 32 + b"\n")

        # Desconto / taxa
        if dados.get("desconto"):
            linhas.append(b"\x1b\x61\x00")
            linhas.append(self._justificar("Desconto", f"-R$ {dados['desconto']:.2f}", 32).encode("utf-8") + b"\n")
        if dados.get("taxa"):
            linhas.append(b"\x1b\x61\x00")
            linhas.append(self._justificar("Taxa de servico", f"+R$ {dados['taxa']:.2f}", 32).encode("utf-8") + b"\n")

        # Total em destaque máximo
        linhas.append(b"\x1b\x61\x01")  # Centralizar
        linhas.append(b"\x1d\x21\x11")  # FONT_LARGE
        linhas.append(b"\x1b\x45\x01")  # Negrito ON
        linhas.append(f"TOTAL: R$ {dados.get('valor_final', 0.0):.2f}\n".encode("utf-8"))
        linhas.append(b"\x1b\x45\x00")  # Negrito OFF
        linhas.append(b"\x1d\x21\x00")  # Normal

        # Forma de pagamento
        if dados.get("forma_pagamento"):
            linhas.append(b"\x1b\x61\x00")
            linhas.append(f"Pagamento: {dados['forma_pagamento']}\n".encode("utf-8"))

        # QR PIX (quando pago via PIX e há chave configurada)
        chave_pix = settings.PIX_CHAVE or dados.get("pix_chave")
        if dados.get("forma_pagamento") == "pix" and chave_pix:
            payload = gerar_payload_pix(
                chave=chave_pix,
                nome=settings.PIX_NOME_RECEBEDOR,
                cidade=settings.PIX_CIDADE,
                valor=dados.get("valor_final", 0.0),
            )
            linhas.append(b"\n")
            linhas.append(b"\x1b\x61\x01")
            linhas.append(b"FACA O PIX PARA PAGAR\n")
            linhas.append(b"\x1b\x61\x00")
            linhas.append(formatar_qr_escpos(payload))
            linhas.append(b"\n")

        # Rodapé
        atendente = dados.get("atendente", "Sistema")
        linhas.append(b"\x1b\x61\x00")
        linhas.append(f"Atendente: {atendente}\n".encode("utf-8"))
        linhas.append(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}\n".encode("utf-8"))
        linhas.append(b"\x1b\x61\x01")
        linhas.append(b"Obrigado pela preferencia!\n")
        linhas.append(b"\n\n\n")

        # Cortar papel (parcial)
        linhas.append(b"\x1d\x56\x01")  # Cut parcial

        return b"".join(linhas)

    def formatar_documento(self, dados: dict, tipo: str) -> bytes:
        """Escolhe o formatador conforme o tipo do documento da fila."""
        if tipo == "FECHAMENTO":
            return self.formatar_fechamento_escpos(dados)
        return self.formatar_comanda_escpos(dados)

    # ─── Formatação em texto (modo simulação) ─────────────────────

    def _formatar_comanda_texto(self, dados: dict) -> str:
        """Comanda de produção em texto simples (modo simulação) — sem preços."""
        produto = dados.get("produto", "Produto")
        quantidade = dados.get("quantidade", 1)
        observacao = dados.get("observacao")
        atendente = dados.get("atendente", "Sistema")

        linhas = []
        linhas.append(LINHA)
        linhas.append(self._centralizar("BARIZE"))
        linhas.append(self._centralizar("* COMANDAS *"))
        linhas.append(LINHA)
        linhas.append(f"{quantidade} x {produto}")
        if observacao:
            linhas.append("")
            linhas.append(self._centralizar("[ OBSERVACAO ]"))
            linhas.append(f"  {observacao}")
        linhas.append("")
        linhas.append(f"Atendente: {atendente}")
        linhas.append(datetime.now().strftime("%d/%m/%Y %H:%M"))
        linhas.append(LINHA)
        return "\n".join(linhas)

    def _formatar_fechamento_texto(self, dados: dict) -> str:
        """Fechamento em texto simples (modo simulação) — valores justificados."""
        mesa = dados.get("mesa", "MESA")
        cliente = dados.get("cliente", "")
        atendente = dados.get("atendente", "Sistema")
        itens = dados.get("itens") or []

        linhas = []
        linhas.append(LINHA)
        linhas.append(self._centralizar("BARIZE"))
        linhas.append(self._centralizar(f"Conta {mesa}"))
        if cliente:
            linhas.append(self._centralizar(f"Cliente: {cliente}"))
        linhas.append(LINHA)
        for item in itens:
            qtd_nome = f"{item.get('quantidade', 1)}x {item.get('produto', '')}".strip()
            valor = f"R$ {item.get('preco_total', 0.0):.2f}"
            linhas.append(self._justificar(qtd_nome, valor))
        linhas.append(TRACO)
        if dados.get("desconto"):
            linhas.append(self._justificar("Desconto", f"-R$ {dados['desconto']:.2f}"))
        if dados.get("taxa"):
            linhas.append(self._justificar("Taxa de servico", f"+R$ {dados['taxa']:.2f}"))
        linhas.append("")
        linhas.append(self._centralizar(f"TOTAL: R$ {dados.get('valor_final', 0.0):.2f}"))
        if dados.get("forma_pagamento"):
            linhas.append(f"Pagamento: {dados['forma_pagamento']}")

        chave_pix = settings.PIX_CHAVE or dados.get("pix_chave")
        if dados.get("forma_pagamento") == "pix" and chave_pix:
            payload = gerar_payload_pix(
                chave=chave_pix,
                nome=settings.PIX_NOME_RECEBEDOR,
                cidade=settings.PIX_CIDADE,
                valor=dados.get("valor_final", 0.0),
            )
            linhas.append("")
            linhas.append(self._centralizar("FACA O PIX PARA PAGAR"))
            linhas.append(self._centralizar("[ QR CODE PIX ]"))
            linhas.append(payload)

        linhas.append("")
        linhas.append(f"Atendente: {atendente}")
        linhas.append(datetime.now().strftime("%d/%m/%Y %H:%M"))
        linhas.append(LINHA)
        return "\n".join(linhas)

    # ─── Processamento da fila ────────────────────────────────────

    def processar_fila(self):
        """
        Lê a fila de impressão e processa os trabalhos pendentes,
        roteando cada um para a impressora do seu setor.
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
                    # Resolve a impressora do setor deste trabalho
                    config = self.resolve_config_setor(db, trabalho.impressora_destino)
                    if not config:
                        raise ConnectionError(
                            f"Sem impressora configurada para o setor "
                            f"'{trabalho.impressora_destino or 'CAIXA'}'"
                        )

                    # Se o worker foi iniciado com host explícito, usa ele
                    if self.printer_host:
                        config_uso = None
                    else:
                        config_uso = config

                    # Reconecta apenas se o setor (config) mudou
                    config_id = getattr(config, "id", None)
                    if self._config_atual != config_id:
                        if not self.conectar_impressora(config_uso):
                            raise ConnectionError("Impressora offline após tentativa de reconexão")
                        self._config_atual = config_id
                    elif not self.verificar_impressora_online():
                        if not self.conectar_impressora(config_uso):
                            raise ConnectionError("Impressora offline após tentativa de reconexão")
                        self._config_atual = config_id

                    # Verificação física (DLE EOT 2/4) antes de impressão volumosa
                    status_fisico = self.verificar_impressora_detalhada()
                    if not status_fisico["online"]:
                        raise ConnectionError(
                            f"Impressora indisponível: {status_fisico['offline_razao'] or 'offline'}"
                        )
                    if status_fisico["tampa_aberta"]:
                        raise ConnectionError("Tampa superior da impressora aberta")
                    if status_fisico["papel_esgotado"]:
                        raise ConnectionError("Papel esgotado (fim de bobina)")
                    if status_fisico["erro_mecanico"]:
                        raise ConnectionError("Erro mecânico (guilhotina travada)")
                    if status_fisico["papel_baixo"]:
                        # Aviso preventivo: NÃO bloqueia a impressão
                        logger.warning(
                            f"[WORKER] Aviso: bobina da impressora do setor "
                            f"'{trabalho.impressora_destino or 'CAIXA'}' está no fim (pouco papel)"
                        )

                    # Formata conforme o tipo do documento
                    dados = trabalho.dados_json
                    documento = self.formatar_documento(dados, trabalho.tipo)

                    if ESCPOS_AVAILABLE and self.printer:
                        self.printer._raw(documento)
                    else:
                        texto = documento.decode("utf-8", errors="ignore")
                        logger.info(f"[WORKER] Simulação de impressão ({trabalho.tipo} | setor {trabalho.impressora_destino}):\n{texto}")

                    # Marca como concluído
                    trabalho.status = "CONCLUIDO"
                    db.commit()

                    logger.info(
                        f"[WORKER] {trabalho.tipo} #{trabalho.id} impressa "
                        f"(setor {trabalho.impressora_destino or 'CAIXA'})"
                    )

                except Exception as e:
                    trabalho.tentativas += 1
                    trabalho.erro_msg = str(e)
                    if trabalho.tentativas >= 3:
                        trabalho.status = "ERRO"
                        logger.error(f"[WORKER] {trabalho.tipo} #{trabalho.id} falhou após 3 tentativas: {e}")
                    else:
                        trabalho.status = "PENDENTE"
                        logger.warning(f"[WORKER] {trabalho.tipo} #{trabalho.id} erro (tentativa {trabalho.tentativas}): {e}")
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
