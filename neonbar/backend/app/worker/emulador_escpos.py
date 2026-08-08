"""
BARIZE - Emulador CLI ASCII de impressão ESC/POS 80mm
Pilar 4: Integração de Hardware - Emulação para desenvolvimento/testes

Renderiza o conteúdo ESC/POS (48 colunas, Fonte Tipo A) em ASCII legível,
removendo/mapeando comandos binários. Útil para visualizar o que o worker
vai imprimir sem ter uma impressora física.

Uso:
  python -m app.worker.emulador_escpos --comanda "Caipirinha" --qtd 2
  python -m app.worker.emulador_escpos --fechamento
  python -m app.worker.emulador_escpos --raw < arquivo_escpos.bin
"""

import argparse
import re
import sys
from typing import List

COLUNAS = 48
LINHA = "=" * COLUNAS
TRACO = "-" * COLUNAS


# Mapa de comandos ESC/POS para rótulos legíveis (usado na limpeza)
COMANDOS_LABEL = {
    b"\x1d\x56\x01": "[CORTE PARCIAL]",
    b"\x1d\x56\x00": "[CORTE TOTAL]",
    b"\x1d\x21\x11": "[FONTE LARGE]",
    b"\x1d\x21\x00": "[FONTE NORMAL]",
    b"\x1b\x45\x01": "[NEGRITO ON]",
    b"\x1b\x45\x00": "[NEGRITO OFF]",
    b"\x1b\x61\x00": "[ESQUERDA]",
    b"\x1b\x61\x01": "[CENTRO]",
    b"\x1b\x61\x02": "[DIREITA]",
    b"\x1b\x70\x00\x19\xfa": "[ABRIR GAVETA]",
}


def limpar_comandos_escpos(dados: bytes) -> str:
    """
    Remove comandos binários ESC/POS preservando o texto imprimível.
    Comandos conhecidos viram rótulos; bytes de controle são descartados.
    Retorna uma string com quebras de linha.
    """
    texto = dados.decode("latin-1")

    # Substitui comandos conhecidos por rótulos antes de limpar
    for cmd, label in sorted(COMANDOS_LABEL.items(), key=lambda x: -len(x[0])):
        texto = texto.replace(cmd.decode("latin-1"), label)

    # Remove sequências de escape ESC ... (GS/ESC + bytes)
    # Padrão: ESC (0x1b) seguido de 1..n bytes de comando
    texto = re.sub(r"\x1b[^\n]{1,6}", "", texto)
    # Remove GS (0x1d) e seus parâmetros
    texto = re.sub(r"\x1d[^\n]{1,20}", "", texto)
    # Remove demais bytes de controle (tabs ok, restantes vira espaço)
    texto = "".join(ch if ch in "\n\t" or ord(ch) >= 32 else "" for ch in texto)

    return texto


def renderizar_ascii(dados: bytes, colunas: int = COLUNAS) -> List[str]:
    """
    Converte bytes ESC/POS em linhas de texto ASCII com largura fixa.
    Centraliza linhas marcadas com [CENTRO], justifica por largura.
    """
    texto = limpar_comandos_escpos(dados)
    linhas = []
    for raw in texto.split("\n"):
        linha = raw
        # Remove marcadores de fonte que atrapalham a contagem
        for cmd in ("[FONTE LARGE]", "[FONTE NORMAL]", "[NEGRITO ON]", "[NEGRITO OFF]"):
            linha = linha.replace(cmd, "")
        # Remove marcadores visuais de alinhamento
        centro = "[CENTRO]" in raw
        for cmd in ("[ESQUERDA]", "[CENTRO]", "[DIREITA]", "[ABRIR GAVETA]"):
            linha = linha.replace(cmd, "")
        if not linha:
            linhas.append("")
            continue
        linha = linha.rstrip()
        if centro:
            linhas.append(linha.center(colunas))
        elif len(linha) > colunas:
            linhas.append(linha[:colunas])
        else:
            linhas.append(linha.ljust(colunas))
    return linhas


def print_ascii(dados: bytes, colunas: int = COLUNAS) -> None:
    """Imprime no stdout o conteúdo ESC/POS renderizado em ASCII."""
    for linha in renderizar_ascii(dados, colunas):
        print(linha)
    # Serrilhado de rasgo
    print("~" * colunas)


def main():
    parser = argparse.ArgumentParser(description="Emulador CLI ASCII de impressão 80mm (ESC/POS)")
    parser.add_argument("--comanda", help="Produto da comanda de produção")
    parser.add_argument("--qtd", type=int, default=1, help="Quantidade do produto")
    parser.add_argument("--obs", default=None, help="Observação da comanda")
    parser.add_argument("--fechamento", action="store_true", help="Emula um fechamento de comanda")
    parser.add_argument("--raw", type=str, help="Caminho de arquivo .bin com bytes ESC/POS brutos")
    parser.add_argument("--colunas", type=int, default=COLUNAS, help="Largura da bobina")
    args = parser.parse_args()

    from .impressao_worker import ImpressaoWorker, gerar_payload_pix

    worker = ImpressaoWorker()

    if args.raw:
        with open(args.raw, "rb") as f:
            dados = f.read()
    elif args.fechamento:
        dados = worker.formatar_fechamento_escpos({
            "mesa": "12",
            "cliente": "Fulano",
            "itens": [
                {"produto": "Caipirinha de Limao", "quantidade": 2, "preco_total": 24.00},
                {"produto": "Porcao de Batata", "quantidade": 1, "preco_total": 28.00},
            ],
            "valor_bruto": 52.00,
            "desconto": 5.20,
            "taxa": 3.74,
            "valor_final": 50.54,
            "forma_pagamento": "pix",
            "pix_chave": "12345678000199",
            "atendente": "Atendente Teste",
        })
    else:
        dados = worker.formatar_comanda_escpos({
            "produto": args.comanda or "Caipirinha",
            "quantidade": args.qtd,
            "observacao": args.obs or "sem acucar, caprichar no limao",
            "atendente": "Atendente Teste",
        })

    print_ascii(dados, args.colunas)


if __name__ == "__main__":
    main()
