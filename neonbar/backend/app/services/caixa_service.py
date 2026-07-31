"""
BARIZE - Serviço de Caixa
Pilar 6: Operacional - Rotina de Fechamento de Caixa
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Optional, Dict, Tuple
from datetime import datetime, date, timezone as dt_timezone
from loguru import logger

from ..models.caixa import Caixa, FechamentoCaixa
from ..models.movimentacao import Movimentacao
from ..models.produto import Produto


class CaixaService:
    """
    Gerencia abertura, fechamento e conciliação de caixa.
    """

    @staticmethod
    def abrir_caixa(
        db: Session,
        usuario_id: int,
        saldo_inicial: float = 0.0,
    ) -> Tuple[bool, str, Optional[Caixa]]:
        """Abre um novo caixa (início do dia)."""
        # Verifica se já existe caixa aberto
        caixa_aberto = (
            db.query(Caixa)
            .filter(Caixa.status == "ABERTO")
            .first()
        )
        if caixa_aberto:
            return False, "Já existe um caixa aberto", None

        caixa = Caixa(
            usuario_id=usuario_id,
            status="ABERTO",
            saldo_inicial=saldo_inicial,
        )
        db.add(caixa)
        db.commit()
        db.refresh(caixa)

        logger.info(f"[CAIXA] Aberto #{caixa.id} | Saldo inicial: R${saldo_inicial:.2f}")
        return True, "Caixa aberto com sucesso", caixa

    @staticmethod
    def fechar_caixa(
        db: Session,
        caixa_id: int,
        valores_declarados: Dict[str, float],
        observacao: Optional[str] = None,
    ) -> Tuple[bool, str, Optional[Dict]]:
        """
        Fecha o caixa, conciliando valores do sistema com declarados.
        """
        caixa = db.query(Caixa).filter(Caixa.id == caixa_id).first()
        if not caixa:
            return False, "Caixa não encontrado", None
        if caixa.status == "FECHADO":
            return False, "Caixa já está fechado", None

        # Calcula vendas do período por forma de pagamento
        # Nota: Em um sistema real, as vendas teriam forma de pagamento
        # Aqui simulamos baseado no valor total das movimentações
        total_vendas = (
            db.query(func.sum(Movimentacao.quantidade * -1))
            .filter(
                Movimentacao.tipo == "VENDA",
                Movimentacao.data >= caixa.data_abertura,
            )
            .scalar() or 0.0
        )

        # Valor total de vendas em reais
        from sqlalchemy import text
        sql = text("""
            SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND m.data >= :data_abertura
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
        """)
        receita_total = db.execute(sql, {"data_abertura": caixa.data_abertura}).scalar() or 0.0

        # Se não temos valores declarados, usamos o total das vendas
        valor_sistema_total = receita_total + caixa.saldo_inicial
        valor_declarado_total = sum(valores_declarados.values())

        # Registra fechamentos por forma de pagamento
        diferencas = {}
        for forma, valor_declarado in valores_declarados.items():
            # Distribui proporcionalmente o valor do sistema
            proporcao = (
                valor_declarado / valor_declarado_total
                if valor_declarado_total > 0
                else 0
            )
            valor_sistema_parcial = receita_total * proporcao

            fechamento = FechamentoCaixa(
                caixa_id=caixa_id,
                forma_pagamento=forma,
                valor_sistema=round(valor_sistema_parcial, 2),
                valor_declarado=valor_declarado,
                diferenca=round(valor_declarado - valor_sistema_parcial, 2),
            )
            db.add(fechamento)
            diferencas[forma] = round(valor_declarado - valor_sistema_parcial, 2)

        # Atualiza caixa
        caixa.status = "FECHADO"
        caixa.saldo_final_esperado = round(receita_total + caixa.saldo_inicial, 2)
        caixa.saldo_final_declarado = round(valor_declarado_total, 2)
        caixa.diferenca = round(valor_declarado_total - (receita_total + caixa.saldo_inicial), 2)
        caixa.valores_declarados = valores_declarados
        caixa.data_fechamento = datetime.now(dt_timezone.utc)
        caixa.observacao = observacao

        db.commit()

        resultado = {
            "caixa_id": caixa.id,
            "saldo_inicial": caixa.saldo_inicial,
            "receita_total": round(receita_total, 2),
            "saldo_esperado": caixa.saldo_final_esperado,
            "saldo_declarado": caixa.saldo_final_declarado,
            "diferenca": caixa.diferenca,
            "diferencas_por_pagamento": diferencas,
            "data_fechamento": caixa.data_fechamento.isoformat(),
        }

        logger.info(
            f"[CAIXA] Fechado #{caixa.id} | "
            f"Esperado: R${caixa.saldo_final_esperado:.2f} | "
            f"Declarado: R${caixa.saldo_final_declarado:.2f} | "
            f"Diferença: R${caixa.diferenca:+.2f}"
        )
        return True, "Caixa fechado com sucesso", resultado

    @staticmethod
    def obter_resumo_diario(db: Session, data: Optional[date] = None) -> dict:
        """Obtém resumo financeiro do dia."""
        if not data:
            data = datetime.now(dt_timezone.utc).date()

        from datetime import timedelta
        data_inicio = datetime.combine(data, datetime.min.time())
        data_fim = datetime.combine(data, datetime.max.time())

        sql_vendas = text("""
            SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND m.data BETWEEN :data_inicio AND :data_fim
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
        """)
        receita = db.execute(
            sql_vendas,
            {"data_inicio": data_inicio, "data_fim": data_fim},
        ).scalar() or 0.0

        # Total de itens vendidos (soma quantidade_produto)
        total_itens = (
            db.query(func.sum(Movimentacao.quantidade_produto))
            .filter(
                Movimentacao.tipo == "VENDA",
                Movimentacao.quantidade_produto.isnot(None),
                Movimentacao.data.between(data_inicio, data_fim),
            )
            .scalar() or 0
        )

        # Caixas do dia
        caixas = (
            db.query(Caixa)
            .filter(Caixa.data_abertura.between(data_inicio, data_fim))
            .all()
        )

        return {
            "data": data.isoformat(),
            "receita_total": round(receita, 2),
            "total_itens_vendidos": int(total_itens),
            "caixas_abertos": len([c for c in caixas if c.status == "ABERTO"]),
            "caixas_fechados": len([c for c in caixas if c.status == "FECHADO"]),
        }
