"""
BARIZE - Rotas do PDV (Ponto de Venda)
Pilar 6: Operacional - Vendas e Comandas
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from pydantic import BaseModel, Field
from loguru import logger

from ..database import get_db
from ..models.produto import Produto
from ..models.usuario import Usuario
from ..models.fila_impressao import FilaImpressao
from ..models.pedido import Pedido
from ..schemas.produto import ProdutoResponse, ProdutoCreate, ProdutoUpdate
from ..services.auth_service import get_current_user, verificar_role
from ..services.estoque_service import EstoqueService
from ..services.audit_service import AuditService

router = APIRouter(prefix="/pdv", tags=["PDV - Vendas"])


# Categorias que pertencem ao setor BAR (bebidas/coquetéis). Demais vão para COZINHA.
CATEGORIAS_BAR = ("bebida", "bebidas", "drink", "drinks", "coquetel", "coqueteis", "cerveja", "cervejas",
                  "destilado", "destilados", "whisky", "vinho", "vinhos", "refrigerante", "refrigerantes",
                  "suco", "sucos", "água", "agua", "energético", "energetico", "long neck", "longneck")


def _setor_producao(categoria: Optional[str]) -> str:
    """Retorna o setor de impressão da comanda de produção com base na categoria do produto."""
    if categoria:
        cat = categoria.strip().lower()
        if any(keyword in cat for keyword in CATEGORIAS_BAR):
            return "BAR"
    return "COZINHA"


@router.get("/produtos", response_model=List[ProdutoResponse])
def listar_produtos_pdv(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
):
    """Lista produtos ativos para venda."""
    produtos = (
        db.query(Produto)
        .filter(Produto.ativo == 1)
        .order_by(Produto.categoria, Produto.nome)
        .limit(limit)
        .offset(offset)
        .all()
    )
    return [ProdutoResponse.model_validate(p) for p in produtos]


@router.get("/categorias")
def listar_categorias_pdv(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista categorias únicas de produtos ativos (sem paginação)."""
    categorias = db.query(Produto.categoria).filter(
        Produto.ativo == True,
        Produto.categoria.isnot(None)
    ).distinct().all()
    return [c[0] for c in categorias if c[0]]


@router.post("/produtos", response_model=ProdutoResponse, status_code=201)
def criar_produto(
    data: ProdutoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cria um novo produto (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    produto = Produto(
        nome=data.nome,
        descricao=data.descricao,
        categoria=data.categoria,
        preco_venda=data.preco_venda,
        codigo_barras=data.codigo_barras or None,
        imagem=data.imagem,
        foto_url=data.foto_url,
        tempo_preparo=data.tempo_preparo,
    )
    db.add(produto)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um produto com este nome ou código de barras")
    db.refresh(produto)

    AuditService.registrar(
        db=db,
        acao="PRODUTO_CRIADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Produto",
        entidade_id=produto.id,
        descricao=f"Produto '{produto.nome}' criado (R${produto.preco_venda:.2f})",
    )

    return ProdutoResponse.model_validate(produto)


@router.put("/produtos/{produto_id}", response_model=ProdutoResponse)
def atualizar_produto(
    produto_id: int,
    data: ProdutoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza um produto existente (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    estado_anterior = {
        "nome": produto.nome,
        "preco_venda": produto.preco_venda,
        "categoria": produto.categoria,
        "ativo": produto.ativo,
    }

    if data.nome is not None:
        produto.nome = data.nome
    if data.descricao is not None:
        produto.descricao = data.descricao
    if data.categoria is not None:
        produto.categoria = data.categoria
    if data.preco_venda is not None:
        produto.preco_venda = data.preco_venda
    if data.codigo_barras is not None:
        produto.codigo_barras = data.codigo_barras or None
    if data.imagem is not None:
        produto.imagem = data.imagem
    if data.foto_url is not None:
        produto.foto_url = data.foto_url
    if data.ativo is not None:
        produto.ativo = data.ativo
    if data.tempo_preparo is not None:
        produto.tempo_preparo = data.tempo_preparo

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe um produto com este nome ou código de barras")
    db.refresh(produto)

    AuditService.registrar(
        db=db,
        acao="PRODUTO_ATUALIZADO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Produto",
        entidade_id=produto.id,
        descricao=f"Produto '{produto.nome}' atualizado",
        estado_anterior=estado_anterior,
    )

    return ProdutoResponse.model_validate(produto)


@router.delete("/produtos/{produto_id}")
def excluir_produto(
    produto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Exclui (soft delete) um produto (admin)."""
    verificar_role(current_user, ["admin"])

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    produto.ativo = 0
    db.commit()

    AuditService.registrar(
        db=db,
        acao="PRODUTO_EXCLUIDO",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Produto",
        entidade_id=produto.id,
        descricao=f"Produto '{produto.nome}' excluído",
    )

    return {"sucesso": True, "mensagem": f"Produto '{produto.nome}' excluído"}


# ─── Receitas (Composição do Produto) ──────────────────────


@router.get("/produtos/{produto_id}/receitas")
def listar_receitas(
    produto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista os insumos que compõem um produto."""
    from ..models.receita import Receita as ReceitaModel
    from ..models.insumo import Insumo
    from sqlalchemy.orm import joinedload

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    receitas = (
        db.query(ReceitaModel)
        .options(joinedload(ReceitaModel.insumo))
        .filter(ReceitaModel.produto_id == produto_id)
        .all()
    )

    return [
        {
            "id": r.id,
            "insumo_id": r.insumo_id,
            "insumo_nome": r.insumo.nome if r.insumo else None,
            "quantidade_necessaria": r.quantidade_necessaria,
        }
        for r in receitas
    ]


class ReceitaInput(BaseModel):
    insumo_id: int
    quantidade_necessaria: float


@router.put("/produtos/{produto_id}/receitas")
def substituir_receitas(
    produto_id: int,
    receitas: List[ReceitaInput],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Substitui TODAS as receitas de um produto (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    from ..models.receita import Receita as ReceitaModel

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Remove receitas antigas
    db.query(ReceitaModel).filter(ReceitaModel.produto_id == produto_id).delete()
    db.flush()

    # Adiciona novas
    for r in receitas:
        insumo = db.query(ReceitaModel).filter(
            ReceitaModel.insumo_id == r.insumo_id
        ).first()
        nova = ReceitaModel(
            produto_id=produto_id,
            insumo_id=r.insumo_id,
            quantidade_necessaria=r.quantidade_necessaria,
        )
        db.add(nova)

    db.commit()

    AuditService.registrar(
        db=db,
        acao="RECEITA_ATUALIZADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Produto",
        entidade_id=produto_id,
        descricao=f"Receita do produto '{produto.nome}' atualizada ({len(receitas)} insumos)",
    )

    return {"sucesso": True, "mensagem": f"Receita de '{produto.nome}' atualizada com {len(receitas)} insumo(s)"}


@router.post("/produtos/{produto_id}/receitas")
def adicionar_receita(
    produto_id: int,
    data: ReceitaInput,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Adiciona um insumo à receita de um produto (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    from ..models.receita import Receita as ReceitaModel

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Verifica duplicata
    existente = (
        db.query(ReceitaModel)
        .filter(ReceitaModel.produto_id == produto_id, ReceitaModel.insumo_id == data.insumo_id)
        .first()
    )
    if existente:
        raise HTTPException(status_code=409, detail="Este insumo já está na receita do produto")

    nova = ReceitaModel(
        produto_id=produto_id,
        insumo_id=data.insumo_id,
        quantidade_necessaria=data.quantidade_necessaria,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)

    return {
        "id": nova.id,
        "insumo_id": nova.insumo_id,
        "quantidade_necessaria": nova.quantidade_necessaria,
    }


@router.delete("/produtos/{produto_id}/receitas/{receita_id}")
def remover_receita(
    produto_id: int,
    receita_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Remove um insumo da receita de um produto (admin/gerente)."""
    verificar_role(current_user, ["admin", "gerente"])

    from ..models.receita import Receita as ReceitaModel

    receita = (
        db.query(ReceitaModel)
        .filter(ReceitaModel.id == receita_id, ReceitaModel.produto_id == produto_id)
        .first()
    )
    if not receita:
        raise HTTPException(status_code=404, detail="Receita não encontrada")

    db.delete(receita)
    db.commit()

    return {"sucesso": True, "mensagem": "Insumo removido da receita"}


@router.post("/vender")
def vender(
    produto_id: int,
    quantidade: float = Query(default=1.0, gt=0),
    motivo: Optional[str] = None,
    imprimir_comanda: bool = True,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Registra uma venda e dá baixa no estoque.
    Opcionalmente enpara comanda para impressão.
    """
    # Verifica produto
    produto = db.query(Produto).filter(
        Produto.id == produto_id,
        Produto.ativo == 1,
    ).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    # Executa baixa no estoque
    sucesso, msg = EstoqueService.realizar_baixa(
        db=db,
        produto_id=produto_id,
        quantidade_vendida=quantidade,
        usuario_id=current_user.id,
    )

    if not sucesso:
        raise HTTPException(status_code=400, detail=msg)

    # Registra auditoria
    ip_origem = request.client.host if request else None
    AuditService.registrar(
        db=db,
        acao="VENDA_REALIZADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Produto",
        entidade_id=produto_id,
        descricao=f"Venda: {quantidade}x '{produto.nome}' (R${produto.preco_venda:.2f})",
        ip_origem=ip_origem,
    )

    # Enfileira comanda para impressão
    if imprimir_comanda:
        comanda = {
            "produto": produto.nome,
            "quantidade": quantidade,
            "preco_unitario": produto.preco_venda,
            "preco_total": round(produto.preco_venda * quantidade, 2),
            "atendente": current_user.nome,
        }
        fila = FilaImpressao(
            tipo="COMANDA",
            status="PENDENTE",
            dados_json=comanda,
            impressora_destino=_setor_producao(produto.categoria),
        )
        db.add(fila)
        db.commit()
        logger.info(f"[PDV] Comanda enfileirada: {quantidade}x '{produto.nome}' (setor {_setor_producao(produto.categoria)})")

    return {
        "sucesso": True,
        "mensagem": msg,
        "produto": produto.nome,
        "quantidade": quantidade,
        "valor_total": round(produto.preco_venda * quantidade, 2),
    }


# ─── Schemas ────────────────────────────────────────────
class ItemComanda(BaseModel):
    produto_id: int
    quantidade: float = Field(default=1.0, gt=0)
    nota: Optional[str] = None


class FinalizarComandaRequest(BaseModel):
    itens: list[ItemComanda] = []
    imprimir_comanda: bool = True
    desconto_percentual: Optional[float] = Field(default=0.0, ge=0, le=100)
    desconto_fixo: Optional[float] = Field(default=0.0, ge=0)
    taxa_servico_percentual: Optional[float] = Field(default=8.0, ge=0)
    gorjeta_percentual: Optional[float] = Field(default=0.0, ge=0, le=50)
    couver_valor: Optional[float] = Field(default=0.0, ge=0)
    tipo_pedido: Optional[str] = Field(default="consumo", pattern="^(consumo|delivery|levar|retirada)$")
    forma_pagamento: Optional[str] = "dinheiro"
    observacao: Optional[str] = None
    mesa: Optional[str] = None
    cliente: Optional[str] = None
    vendedor: Optional[str] = None


# ─── Rotas ──────────────────────────────────────────────


@router.post("/finalizar-comanda")
def finalizar_comanda(
    body: FinalizarComandaRequest,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Finaliza uma comanda completa (múltiplos itens) em transação ÚNICA e atômica:
    baixa de estoque + pagamento + auditoria + impressão + pedido.
    Tudo ou nada: qualquer falha faz rollback completo.
    """
    from ..models.pagamento import Pagamento
    from ..models.produto import Produto as ProdutoModel

    # ─── Regra de Negócio: Bloqueio de Fechamento ───────────────────────
    # Impede fechamento de mesa/comanda se houver pedidos ativos (Novo/Preparando/Pronto)
    if body.mesa:
        pedidos_ativos = (
            db.query(Pedido)
            .filter(
                Pedido.mesa == body.mesa,
                Pedido.status.in_(["Novo", "Preparando", "Pronto"]),
            )
            .count()
        )
        if pedidos_ativos > 0:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Não é possível fechar a mesa '{body.mesa}': "
                    f"existem {pedidos_ativos} pedido(s) ativo(s) na cozinha/bar. "
                    f"Aguarde a finalização de todos os pedidos antes de fechar."
                ),
            )

    itens_dict = [{"produto_id": i.produto_id, "quantidade": i.quantidade} for i in body.itens]

    try:
        sucesso, msg, resultado = EstoqueService.finalizar_comanda(
            db=db,
            itens=itens_dict,
            usuario_id=current_user.id,
            commit=False,
        )

        if not sucesso:
            db.rollback()
            raise HTTPException(status_code=400, detail=msg)

        # Calcula desconto, taxa, gorjeta e couver
        valor_bruto = resultado["valor_total"]
        desconto = round(valor_bruto * (body.desconto_percentual / 100) + (body.desconto_fixo or 0), 2)
        taxa = round(valor_bruto * (body.taxa_servico_percentual / 100), 2)
        gorjeta = round(valor_bruto * (body.gorjeta_percentual / 100), 2)
        couver = round(body.couver_valor or 0, 2)
        valor_final = round(valor_bruto + couver + gorjeta - desconto + taxa, 2)

        # Cria registro de pagamento vinculado à última movimentação
        venda_id = resultado.get("movimentacoes_ids", [None])[0] if resultado.get("movimentacoes_ids") else None
        pagamento = Pagamento(
            venda_id=venda_id,
            forma_pagamento=body.forma_pagamento,
            valor=valor_final,
        )
        db.add(pagamento)
        db.flush()

        # Registra auditoria (sem commit — transação única)
        ip_origem = request.client.host if request else None
        AuditService.registrar(
            db=db,
            acao="COMANDA_FINALIZADA",
            usuario_id=current_user.id,
            usuario_nome=current_user.nome,
            entidade_tipo="Comanda",
            descricao=(
                f"Comanda finalizada: {resultado['total_itens']} itens, "
                f"R${valor_bruto:.2f} - desc R${desconto:.2f} + taxa R${taxa:.2f} "
                f"+ gorjeta R${gorjeta:.2f} + couver R${couver:.2f} = R${valor_final:.2f} "
                f"({body.forma_pagamento})"
            ),
            ip_origem=ip_origem,
            commit=False,
        )

        # Enfileira impressão de cada item (comanda de produção — setor por categoria)
        if body.imprimir_comanda:
            atendente = body.vendedor or current_user.nome
            setores_por_item = []
            for item_req in body.itens:
                prod = db.query(Produto).filter(Produto.id == item_req.produto_id).first()
                setores_por_item.append(_setor_producao(prod.categoria) if prod else "COZINHA")
            for i, item in enumerate(resultado["itens"]):
                setor = setores_por_item[i] if i < len(setores_por_item) else "COZINHA"
                comanda = {
                    "produto": item["produto"],
                    "quantidade": item["quantidade"],
                    "preco_unitario": item["preco_unitario"],
                    "preco_total": item["subtotal"],
                    "atendente": atendente,
                }
                fila = FilaImpressao(
                    tipo="COMANDA",
                    status="PENDENTE",
                    dados_json=comanda,
                    impressora_destino=setor,
                )
                db.add(fila)
            # Fechamento da comanda (pré-conta/total) → impressora do CAIXA
            fila_fechamento = FilaImpressao(
                tipo="FECHAMENTO",
                status="PENDENTE",
                dados_json={
                    "mesa": body.mesa,
                    "cliente": body.cliente or "",
                    "itens": resultado["itens"],
                    "valor_bruto": valor_bruto,
                    "desconto": desconto,
                    "taxa": taxa,
                    "valor_final": valor_final,
                    "forma_pagamento": body.forma_pagamento,
                    "atendente": atendente,
                },
                impressora_destino="CAIXA",
            )
            db.add(fila_fechamento)

        # Calcula tempo de preparo estimado (maior tempo entre os itens)
        tempo_max = 0
        for item in body.itens:
            prod = db.query(ProdutoModel).filter(ProdutoModel.id == item.produto_id).first()
            if prod and prod.tempo_preparo:
                tempo_max = max(tempo_max, prod.tempo_preparo)
        tempo_preparo = tempo_max if tempo_max > 0 else 5  # default 5 min

        # Cria Pedido para aparecer na tela de Comandas
        itens_pedido = []
        for i, item in enumerate(resultado["itens"]):
            obs = body.itens[i].nota if i < len(body.itens) else None
            itens_pedido.append({
                "nome": item["produto"],
                "quantidade": item["quantidade"],
                "preco": item["preco_unitario"],
                "observacao": obs,
            })
        pedido = Pedido(
            mesa=body.mesa,
            cliente=body.cliente,
            status="Novo",
            itens=itens_pedido,
            total=round(valor_final, 2),
            observacao=body.observacao,
            tipo_pedido=body.tipo_pedido or "consumo",
            tempo_preparo_estimado=tempo_preparo,
        )
        db.add(pedido)
        db.flush()  # Garante que pedido.id está disponível

        # Vincula movimentações de estoque ao Pedido (para estorno no cancelamento)
        from ..models.movimentacao import Movimentacao as MovModel
        mov_ids = resultado.get("movimentacoes_ids", [])
        if mov_ids:
            db.query(MovModel).filter(MovModel.id.in_(mov_ids)).update(
                {MovModel.pedido_id: pedido.id}, synchronize_session=False
            )

        # ─── COMMIT ÚNICO: tudo ou nada ───
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        logger.exception("[PDV] Falha ao finalizar comanda")
        raise HTTPException(status_code=500, detail=f"Erro ao finalizar comanda: {exc}") from exc

    return {
        "sucesso": True,
        "mensagem": msg,
        "resultado": {
            **resultado,
            "desconto": desconto,
            "taxa_servico": taxa,
            "valor_final": valor_final,
            "forma_pagamento": body.forma_pagamento,
            "pagamento_id": pagamento.id,
            "pedido_id": pedido.id,
        },
    }


# ─── Helper: Calcular Custo Total ─────────────────────────


def _calcular_custo_total(db: Session, produto_id: int) -> tuple:
    """Calcula custo total do produto baseado nas receitas e insumos atuais.
    Returns (custo_total, markup_factor)."""
    from ..models.receita import Receita as ReceitaModel
    from ..models.insumo import Insumo
    from sqlalchemy.orm import joinedload

    receitas = (
        db.query(ReceitaModel)
        .options(joinedload(ReceitaModel.insumo))
        .filter(ReceitaModel.produto_id == produto_id)
        .all()
    )
    custo_total = 0.0
    detalhes = []
    for r in receitas:
        insumo = r.insumo
        if insumo:
            custo_parcial = r.quantidade_necessaria * insumo.custo_unitario
            custo_total += custo_parcial
            detalhes.append({
                "insumo_id": insumo.id,
                "insumo_nome": insumo.nome,
                "quantidade_necessaria": r.quantidade_necessaria,
                "custo_unitario": insumo.custo_unitario,
                "custo_parcial": round(custo_parcial, 4),
            })
    custo_total = round(custo_total, 2)
    markup_factor = 2.5
    return custo_total, markup_factor, detalhes


# ─── Ficha Técnica ────────────────────────────────────────


class FichaTecnicaUpdate(BaseModel):
    modo_preparo: Optional[str] = None
    tipo_copo: Optional[str] = None
    guarnicao: Optional[str] = None
    tempo_preparo: Optional[int] = None
    dificuldade: Optional[str] = None
    teor_alcoolico: Optional[float] = None


@router.get("/produtos/fichas-tecnicas")
def listar_fichas_tecnicas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os produtos com dados resumidos da ficha técnica."""
    from ..models.receita import Receita as ReceitaModel
    from ..models.insumo import Insumo
    from sqlalchemy.orm import joinedload

    produtos = db.query(Produto).filter(Produto.ativo == 1).order_by(Produto.nome).all()
    produto_ids = [p.id for p in produtos]

    receitas_por_produto = {}
    if produto_ids:
        receitas = (
            db.query(ReceitaModel)
            .options(joinedload(ReceitaModel.insumo))
            .filter(ReceitaModel.produto_id.in_(produto_ids))
            .all()
        )
        for r in receitas:
            receitas_por_produto.setdefault(r.produto_id, []).append(r)

    result = []
    for p in produtos:
        receitas = receitas_por_produto.get(p.id, [])
        custo_total = 0.0
        for r in receitas:
            if r.insumo:
                custo_total += r.quantidade_necessaria * r.insumo.custo_unitario
        custo_total = round(custo_total, 2)
        markup = 2.5
        result.append({
            "id": p.id,
            "nome": p.nome,
            "categoria": p.categoria,
            "foto_url": p.foto_url,
            "imagem": p.imagem,
            "preco_venda": p.preco_venda,
            "custo_total": custo_total,
            "preco_sugerido": round(custo_total * markup, 2) if custo_total else None,
            "modo_preparo": p.modo_preparo,
            "tipo_copo": p.tipo_copo,
            "tempo_preparo": p.tempo_preparo,
            "dificuldade": p.dificuldade,
            "teor_alcoolico": p.teor_alcoolico,
        })
    return result


@router.get("/produtos/{produto_id}/ficha-tecnica")
def obter_ficha_tecnica(
    produto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Retorna a ficha técnica completa de um produto."""
    from ..models.receita import Receita as ReceitaModel
    from ..models.insumo import Insumo

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    custo_total, markup, detalhes = _calcular_custo_total(db, produto_id)
    preco_sugerido = round(custo_total * markup, 2)
    margem = 0.0
    if produto.preco_venda > 0 and custo_total > 0:
        margem = round((produto.preco_venda - custo_total) / produto.preco_venda * 100, 2)

    return {
        "produto": {
            "id": produto.id,
            "nome": produto.nome,
            "descricao": produto.descricao,
            "categoria": produto.categoria,
            "preco_venda": produto.preco_venda,
            "codigo_barras": produto.codigo_barras,
            "foto_url": produto.foto_url,
            "imagem": produto.imagem,
        },
        "ficha_tecnica": {
            "modo_preparo": produto.modo_preparo,
            "tipo_copo": produto.tipo_copo,
            "guarnicao": produto.guarnicao,
            "tempo_preparo": produto.tempo_preparo,
            "dificuldade": produto.dificuldade,
            "teor_alcoolico": produto.teor_alcoolico,
            "custo_total": custo_total,
            "preco_sugerido": preco_sugerido,
            "markup": markup,
            "margem_lucro": margem,
        },
        "receita": detalhes,
    }


@router.put("/produtos/{produto_id}/ficha-tecnica")
def atualizar_ficha_tecnica(
    produto_id: int,
    data: FichaTecnicaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Atualiza os campos da ficha técnica e recalcula custo + preço sugerido."""
    verificar_role(current_user, ["admin", "gerente"])

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(produto, field, value)

    # Recalcula custo total e preço sugerido
    custo_total, markup, _ = _calcular_custo_total(db, produto_id)
    produto.custo_total = custo_total
    produto.preco_sugerido = round(custo_total * markup, 2)

    db.commit()
    db.refresh(produto)

    return {
        "sucesso": True,
        "produto_id": produto.id,
        "custo_total": produto.custo_total,
        "preco_sugerido": produto.preco_sugerido,
    }


@router.post("/produtos/{produto_id}/receitas/calcular-custo")
def recalcular_custo(
    produto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Recalcula custo total e preço sugerido com base nos insumos atuais."""
    verificar_role(current_user, ["admin", "gerente"])

    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    custo_total, markup, detalhes = _calcular_custo_total(db, produto_id)
    produto.custo_total = custo_total
    produto.preco_sugerido = round(custo_total * markup, 2)

    db.commit()
    db.refresh(produto)

    return {
        "sucesso": True,
        "produto_id": produto.id,
        "custo_total": produto.custo_total,
        "preco_sugerido": produto.preco_sugerido,
        "markup": markup,
        "receita": detalhes,
    }


@router.post("/cancelar-venda")
def cancelar_venda(
    movimentacao_id: int,
    motivo: str,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Cancela uma venda (estorno).
    Requer motivo obrigatório.
    """
    from ..models.movimentacao import Movimentacao
    from ..models.insumo import Insumo

    if not motivo or len(motivo.strip()) < 3:
        raise HTTPException(status_code=400, detail="Motivo é obrigatório (mínimo 3 caracteres)")

    mov = db.query(Movimentacao).filter(
        Movimentacao.id == movimentacao_id,
        Movimentacao.tipo == "VENDA",
    ).first()

    if not mov:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")

    # Estado anterior para auditoria
    estado_anterior = {
        "insumo_id": mov.insumo_id,
        "quantidade": mov.quantidade,
        "produto_id": mov.produto_id,
    }

    # Estorna: devolve insumos ao estoque
    insumo = db.query(Insumo).filter(Insumo.id == mov.insumo_id).first()
    if insumo:
        insumo.estoque_atual -= mov.quantidade  # mov.quantidade é negativo, então -= negativo = +

    # Marca como cancelada (cria movimentação de ajuste)
    from ..models.movimentacao import Movimentacao as Mov
    estorno = Mov(
        insumo_id=mov.insumo_id,
        tipo="AJUSTE",
        quantidade=-mov.quantidade,  # Reverte o sinal
        custo_no_momento=mov.custo_no_momento,
        produto_id=mov.produto_id,
        observacao=f"Estorno de movimentação #{mov.id}. Motivo: {motivo}",
        usuario_id=current_user.id,
    )
    db.add(estorno)

    ip_origem = request.client.host if request else None
    AuditService.registrar(
        db=db,
        acao="VENDA_CANCELADA",
        usuario_id=current_user.id,
        usuario_nome=current_user.nome,
        entidade_tipo="Movimentacao",
        entidade_id=mov.id,
        descricao=f"Venda #{mov.id} cancelada. Motivo: {motivo}",
        estado_anterior=estado_anterior,
        motivo=motivo,
        ip_origem=ip_origem,
    )

    db.commit()
    logger.warning(f"[PDV] Venda #{mov.id} cancelada por {current_user.nome}. Motivo: {motivo}")

    return {
        "sucesso": True,
        "mensagem": f"Venda #{mov.id} cancelada. Estoque restaurado.",
    }
