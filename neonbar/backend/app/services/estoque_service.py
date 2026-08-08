"""
BARIZE - Serviço de Estoque
Pilar 3: Banco de Dados - Integridade Referencial
Pilar 6: Operacional - Controle de Estoque
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, Tuple
from loguru import logger

from ..models.insumo import Insumo
from ..models.receita import Receita
from ..models.movimentacao import Movimentacao
from ..models.produto import Produto


class EstoqueService:
    """
    Gerencia entradas, saídas e consultas de estoque.
    """

    @staticmethod
    def dar_entrada(
        db: Session,
        insumo_id: int,
        quantidade: float,
        custo_compra: float,
        documento_referencia: Optional[str] = None,
        observacao: Optional[str] = None,
        usuario_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        """
        Registra entrada de mercadoria (COMPRA).
        Atualiza estoque e custo médio.
        """
        insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
        if not insumo:
            return False, "Insumo não encontrado"

        if quantidade <= 0:
            return False, "Quantidade deve ser positiva"

        # Atualiza custo médio ponderado
        estoque_anterior = insumo.estoque_atual
        custo_total_anterior = estoque_anterior * insumo.custo_unitario
        custo_total_novo = custo_total_anterior + (quantidade * custo_compra)
        novo_estoque = estoque_anterior + quantidade

        if novo_estoque > 0:
            insumo.custo_unitario = round(custo_total_novo / novo_estoque, 4)
        insumo.estoque_atual = novo_estoque

        # Registra movimentação
        mov = Movimentacao(
            insumo_id=insumo_id,
            tipo="COMPRA",
            quantidade=quantidade,
            custo_no_momento=custo_compra,
            documento_referencia=documento_referencia,
            observacao=observacao,
            usuario_id=usuario_id,
        )
        db.add(mov)
        db.commit()

        logger.info(
            f"[ESTOQUE] Entrada: {insumo.nome} +{quantidade} "
            f"(custo: R${custo_compra:.2f}) | Estoque: {estoque_anterior} -> {novo_estoque}"
        )
        return True, f"Entrada de {quantidade} {insumo.unidade_medida} de '{insumo.nome}' registrada"

    @staticmethod
    def realizar_baixa(
        db: Session,
        produto_id: int,
        quantidade_vendida: float = 1.0,
        usuario_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        """
        Dá baixa no estoque ao vender um produto.
        Reduz o estoque de cada insumo da receita.
        """
        if quantidade_vendida <= 0:
            return False, "Quantidade deve ser maior que zero"

        produto = db.query(Produto).filter(Produto.id == produto_id).first()
        if not produto:
            return False, "Produto não encontrado"

        receitas = db.query(Receita).filter(Receita.produto_id == produto_id).all()
        if not receitas:
            return False, f"Produto '{produto.nome}' não possui receita cadastrada"

        # ─── Validação de Estoque ───────────────────────
        for r in receitas:
            insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
            if not insumo:
                return False, f"Insumo ID {r.insumo_id} não encontrado"
            consumo = r.quantidade_necessaria * quantidade_vendida
            if insumo.estoque_atual < consumo:
                return False, (
                    f"Estoque insuficiente de '{insumo.nome}': "
                    f"tem {insumo.estoque_atual:.2f} {insumo.unidade_medida}, "
                    f"precisa de {consumo:.2f}"
                )

        # ─── Efetivação da Baixa ────────────────────────
        for i, r in enumerate(receitas):
            insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
            consumo = r.quantidade_necessaria * quantidade_vendida
            insumo.estoque_atual -= consumo

            # Apenas a primeira movimentação armazena a quantidade de produto
            qtd_produto = quantidade_vendida if i == 0 else None

            mov = Movimentacao(
                insumo_id=insumo.id,
                tipo="VENDA",
                quantidade=-consumo,
                custo_no_momento=insumo.custo_unitario,
                produto_id=produto_id,
                quantidade_produto=qtd_produto,
                usuario_id=usuario_id,
            )
            db.add(mov)

        db.commit()
        logger.info(
            f"[ESTOQUE] Baixa: {quantidade_vendida}x '{produto.nome}' | "
            f"{len(receitas)} insumos consumidos"
        )
        return True, f"Venda de {quantidade_vendida}x '{produto.nome}' registrada. Estoque baixado."

    @staticmethod
    def finalizar_comanda(
        db: Session,
        itens: list[dict],
        usuario_id: Optional[int] = None,
        commit: bool = True,
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Finaliza uma comanda completa (múltiplos itens) em transação única.
        Tudo ou nada: valida TODOS os itens ANTES de debitar.
        
        Args:
            itens: Lista de dicts [{"produto_id": int, "quantidade": float}, ...]
            commit: Se False, apenas faz flush (o caller controla o commit final,
                    permitindo transação atômica com pagamento/pedido).
        """
        if not itens:
            return False, "Comanda vazia", None

        # ─── 1. VALIDAÇÃO PRÉVIA (tudo antes de debitar) ───
        itens_validados = []
        valor_total = 0.0
        detalhes = []

        for item in itens:
            produto_id = item.get("produto_id")
            quantidade = item.get("quantidade", 1.0)
            if quantidade <= 0:
                return False, "Quantidade deve ser maior que zero", None

            produto = db.query(Produto).filter(Produto.id == produto_id, Produto.ativo == 1).first()
            if not produto:
                return False, f"Produto ID {produto_id} não encontrado", None

            receitas = db.query(Receita).filter(Receita.produto_id == produto_id).all()
            if not receitas:
                return False, f"Produto '{produto.nome}' não possui receita cadastrada", None

            for r in receitas:
                insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
                if not insumo:
                    return False, f"Insumo ID {r.insumo_id} não encontrado", None
                consumo = r.quantidade_necessaria * quantidade
                if insumo.estoque_atual < consumo:
                    return False, (
                        f"Estoque insuficiente de '{insumo.nome}' para '{produto.nome}': "
                        f"tem {insumo.estoque_atual:.2f} {insumo.unidade_medida}, "
                        f"precisa de {consumo:.2f}"
                    ), None

            itens_validados.append((produto, quantidade, receitas))
            valor_total += produto.preco_venda * quantidade
            detalhes.append({
                "produto": produto.nome,
                "quantidade": quantidade,
                "preco_unitario": produto.preco_venda,
                "subtotal": round(produto.preco_venda * quantidade, 2),
            })

        # ─── 2. EFETIVAÇÃO (tudo numa transação) ───
        movimentacoes_ids = []
        for produto, quantidade, receitas in itens_validados:
            for i, r in enumerate(receitas):
                insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
                consumo = r.quantidade_necessaria * quantidade
                insumo.estoque_atual -= consumo

                qtd_produto = quantidade if i == 0 else None
                mov = Movimentacao(
                    insumo_id=insumo.id,
                    tipo="VENDA",
                    quantidade=-consumo,
                    custo_no_momento=insumo.custo_unitario,
                    produto_id=produto.id,
                    quantidade_produto=qtd_produto,
                    usuario_id=usuario_id,
                )
                db.add(mov)
                db.flush()
                if qtd_produto is not None:
                    movimentacoes_ids.append(mov.id)

        if commit:
            db.commit()
        else:
            db.flush()

        logger.info(
            f"[ESTOQUE] Comanda finalizada: {len(itens)} itens, "
            f"R${valor_total:.2f}, {len(movimentacoes_ids)} movimentações"
        )

        return True, "Comanda finalizada com sucesso", {
            "itens": detalhes,
            "total_itens": len(itens),
            "valor_total": round(valor_total, 2),
            "movimentacoes": len(movimentacoes_ids),
            "movimentacoes_ids": movimentacoes_ids,
        }

    @staticmethod
    def ajustar_estoque(
        db: Session,
        insumo_id: int,
        novo_estoque: float,
        motivo: str,
        usuario_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        """
        Ajuste manual de inventário (físico vs sistema).
        """
        insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
        if not insumo:
            return False, "Insumo não encontrado"

        diferenca = round(novo_estoque - insumo.estoque_atual, 4)
        if diferenca == 0:
            return True, "Estoque já está no valor informado"

        mov = Movimentacao(
            insumo_id=insumo_id,
            tipo="AJUSTE",
            quantidade=diferenca,
            custo_no_momento=insumo.custo_unitario,
            observacao=f"Ajuste inventário: {insumo.estoque_atual} -> {novo_estoque}. Motivo: {motivo}",
            usuario_id=usuario_id,
        )
        db.add(mov)
        insumo.estoque_atual = novo_estoque
        db.commit()

        logger.info(
            f"[ESTOQUE] Ajuste: {insumo.nome} {insumo.estoque_atual - diferenca:.2f} -> {novo_estoque:.2f} "
            f"({diferenca:+.2f}) | Motivo: {motivo}"
        )
        return True, f"Estoque de '{insumo.nome}' ajustado para {novo_estoque:.2f}"

    @staticmethod
    def registrar_perda(
        db: Session,
        insumo_id: int,
        quantidade: float,
        motivo: str,
        usuario_id: Optional[int] = None,
    ) -> Tuple[bool, str]:
        """Registra perda/quebra/vencimento de insumo."""
        insumo = db.query(Insumo).filter(Insumo.id == insumo_id).first()
        if not insumo:
            return False, "Insumo não encontrado"
        if quantidade <= 0:
            return False, "Quantidade deve ser positiva"
        if insumo.estoque_atual < quantidade:
            return False, f"Estoque insuficiente para registrar perda de {quantidade}"

        insumo.estoque_atual -= quantidade
        mov = Movimentacao(
            insumo_id=insumo_id,
            tipo="PERDA",
            quantidade=-quantidade,
            custo_no_momento=insumo.custo_unitario,
            observacao=f"Perda: {motivo}",
            usuario_id=usuario_id,
        )
        db.add(mov)
        db.commit()

        return True, f"Perda de {quantidade} de '{insumo.nome}' registrada"

    @staticmethod
    def verificar_estoque_minimo(db: Session) -> list[Insumo]:
        """Retorna lista de insumos abaixo do estoque mínimo."""
        return (
            db.query(Insumo)
            .filter(
                Insumo.ativo == 1,
                Insumo.estoque_minimo > 0,
                Insumo.estoque_atual <= Insumo.estoque_minimo,
            )
            .all()
        )

    @staticmethod
    def calcular_cmv(db: Session, data_inicio=None, data_fim=None) -> dict:
        """
        Calcula o Custo de Mercadoria Vendida (CMV) no período.
        CMV = Soma do custo de todas as movimentações de VENDA no período.
        """
        query = db.query(
            func.sum(Movimentacao.quantidade * Movimentacao.custo_no_momento)
        ).filter(Movimentacao.tipo == "VENDA")

        if data_inicio:
            query = query.filter(Movimentacao.data >= data_inicio)
        if data_fim:
            query = query.filter(Movimentacao.data <= data_fim)

        total_custo = query.scalar() or 0.0

        # Total de vendas em valor (preço de venda × quantidade vendida)
        # Usa quantidade_produto (preenchida apenas na primeira movimentação de cada venda)
        from sqlalchemy import text
        sql = text("""
            SELECT COALESCE(SUM(p.preco_venda * m.quantidade_produto), 0)
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.produto_id
            WHERE m.tipo = 'VENDA'
            AND m.produto_id IS NOT NULL
            AND m.quantidade_produto IS NOT NULL
            AND (:di IS NULL OR m.data >= :di)
            AND (:df IS NULL OR m.data <= :df)
        """)
        total_vendas = db.execute(
            sql, {"di": data_inicio, "df": data_fim}
        ).scalar() or 0.0

        return {
            "custo_total": round(abs(total_custo), 2),
            "receita_total": round(total_vendas, 2),
            "cmv_percentual": round(
                (abs(total_custo) / total_vendas * 100) if total_vendas > 0 else 0, 2
            ),
        }
