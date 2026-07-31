from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from loguru import logger

from ..database import get_db
from ..models.usuario import Usuario
from ..models.produto import Produto
from ..models.insumo import Insumo
from ..models.receita import Receita
from ..schemas.ficha_tecnica import FichaTecnicaItem, FichaTecnicaFilter
from ..services.auth_service import get_current_user, verificar_role

router = APIRouter(prefix="/fichas-tecnicas", tags=["Fichas Técnicas"])


def calcular_custo_total(db: Session, produto_id: int) -> float:
    """Calcula o custo total de um produto baseado na receita."""
    receitas = db.query(Receita).filter(Receita.produto_id == produto_id).all()
    total = 0.0
    for r in receitas:
        insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
        if insumo and insumo.custo_unitario:
            total += r.quantidade_necessaria * insumo.custo_unitario
    return round(total, 2)


def calcular_margem_lucro(preco_venda: float, custo_total: float) -> float:
    """Calcula a margem de lucro em porcentagem."""
    if custo_total <= 0:
        return 0.0
    return round(((preco_venda - custo_total) / preco_venda) * 100, 2)


def estimar_informacoes_nutricionais(db: Session, produto_id: int) -> dict:
    """Estima informações nutricionais baseadas nos ingredientes."""
    receitas = db.query(Receita).filter(Receita.produto_id == produto_id).all()
    
    calorias = 0.0
    carboidratos = 0.0
    proteinas = 0.0
    gorduras = 0.0
    
    # Valores médios por 100g/ml de insumos comuns (estimativas)
    valores_nutricionais = {
        'cachaça': {'cal': 231, 'carb': 0, 'prot': 0, 'gord': 0},
        'vodka': {'cal': 231, 'carb': 0, 'prot': 0, 'gord': 0},
        'gin': {'cal': 263, 'carb': 0, 'prot': 0, 'gord': 0},
        'whisky': {'cal': 250, 'carb': 0, 'prot': 0, 'gord': 0},
        'rum': {'cal': 231, 'carb': 0, 'prot': 0, 'gord': 0},
        'tequila': {'cal': 231, 'carb': 0, 'prot': 0, 'gord': 0},
        'limão': {'cal': 29, 'carb': 9, 'prot': 1.1, 'gord': 0.3},
        'laranja': {'cal': 47, 'carb': 12, 'prot': 0.9, 'gord': 0.1},
        'açúcar': {'cal': 387, 'carb': 100, 'prot': 0, 'gord': 0},
        'xarope': {'cal': 320, 'carb': 80, 'prot': 0, 'gord': 0},
        'gelo': {'cal': 0, 'carb': 0, 'prot': 0, 'gord': 0},
        'água': {'cal': 0, 'carb': 0, 'prot': 0, 'gord': 0},
        'tonica': {'cal': 34, 'carb': 8.8, 'prot': 0, 'gord': 0},
        'refrigerante': {'cal': 42, 'carb': 10.6, 'prot': 0, 'gord': 0},
        'cerveja': {'cal': 43, 'carb': 3.6, 'prot': 0.5, 'gord': 0},
        'vinho': {'cal': 85, 'carb': 2.6, 'prot': 0.1, 'gord': 0},
    }
    
    for r in receitas:
        insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
        if insumo:
            nome_lower = insumo.nome.lower()
            # Encontrar melhor match
            match = None
            for key in valores_nutricionais:
                if key in nome_lower:
                    match = key
                    break
            
            if match:
                vals = valores_nutricionais[match]
                # Converter quantidade para base 100g/ml
                fator = r.quantidade_necessaria / 100.0
                calorias += vals['cal'] * fator
                carboidratos += vals['carb'] * fator
                proteinas += vals['prot'] * fator
                gorduras += vals['gord'] * fator
    
    return {
        'calorias_estimadas': round(calorias, 1),
        'carboidratos_g': round(carboidratos, 1),
        'proteinas_g': round(proteinas, 1),
        'gorduras_g': round(gorduras, 1)
    }


def gerar_tags_inteligentes(db: Session, produto: Produto, receitas: List[Receita]) -> tuple:
    """Gera tags e alérgenos inteligentes baseados nos ingredientes."""
    tags = []
    alergenos = []
    
    # Tags baseadas na categoria
    if produto.categoria:
        cat_lower = produto.categoria.lower()
        if 'clássico' in cat_lower or 'classico' in cat_lower:
            tags.append('classico')
        if 'signature' in cat_lower or 'autor' in cat_lower:
            tags.append('signature')
        if 'sem álcool' in cat_lower or 'sem alcool' in cat_lower:
            tags.append('sem_alcool')
    
    # Analisar ingredientes
    for r in receitas:
        insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
        if insumo:
            nome_lower = insumo.nome.lower()
            
            # Alérgenos
            if any(x in nome_lower for x in ['trigo', 'cevada', 'centeio', 'malte', 'gluten']):
                alergenos.append('gluten')
            if any(x in nome_lower for x in ['leite', 'creme', 'manteiga', 'queijo', 'lactose', 'iogurte']):
                alergenos.append('lactose')
            if any(x in nome_lower for x in ['soja', 'tofu', 'shoyu']):
                alergenos.append('soja')
            if any(x in nome_lower for x in ['amendoim', 'castanha', 'noz', 'amêndoa', 'avelã', 'pistache']):
                alergenos.append('nozes')
            if any(x in nome_lower for x in ['camarão', 'caranguejo', 'lagosta', 'siri', 'crustaceo']):
                alergenos.append('crustaceos')
            if any(x in nome_lower for x in ['ovo', 'gemas', 'claras']):
                alergenos.append('ovos')
            
            # Tags dietéticas
            if 'vegano' in nome_lower or 'plant-based' in nome_lower:
                tags.append('vegano')
            if 'sem gluten' in nome_lower or 'sem glúten' in nome_lower:
                tags.append('sem_gluten')
            if 'light' in nome_lower or 'diet' in nome_lower or 'zero' in nome_lower:
                tags.append('baixo_calorico')
            if 'orgânico' in nome_lower or 'organico' in nome_lower:
                tags.append('organico')
    
    # Tags baseadas no teor alcoólico
    if produto.teor_alcoolico is not None:
        if produto.teor_alcoolico == 0:
            tags.append('sem_alcool')
        elif produto.teor_alcoolico < 10:
            tags.append('baixo_teor')
        elif produto.teor_alcoolico > 25:
            tags.append('alto_teor')
    
    # Remover duplicatas
    tags = list(set(tags))
    alergenos = list(set(alergenos))
    
    return tags, alergenos


def gerar_preparo_padrao(db: Session, produto: Produto, receitas: List[Receita]) -> List[dict]:
    """Gera passos de preparo padrão baseados no tipo de drink."""
    preparo = []
    
    # Determinar técnica baseada na categoria/ingredientes
    tem_fruta = any('limão' in (db.query(Insumo).filter(Insumo.id == r.insumo_id).first().nome.lower() if db.query(Insumo).filter(Insumo.id == r.insumo_id).first() else '') or 'laranja' in (db.query(Insumo).filter(Insumo.id == r.insumo_id).first().nome.lower() if db.query(Insumo).filter(Insumo.id == r.insumo_id).first() else '') for r in receitas)
    tem_xarope = any('xarope' in (db.query(Insumo).filter(Insumo.id == r.insumo_id).first().nome.lower() if db.query(Insumo).filter(Insumo.id == r.insumo_id).first() else '') for r in receitas)
    tem_destilado = any(x in (db.query(Insumo).filter(Insumo.id == r.insumo_id).first().nome.lower() if db.query(Insumo).filter(Insumo.id == r.insumo_id).first() else '') for r in receitas for x in ['cachaça', 'vodka', 'gin', 'whisky', 'rum', 'tequila'])
    
    ordem = 1
    
    if tem_fruta:
        preparo.append({
            'ordem': ordem,
            'descricao': 'Macere levemente as frutas no shaker para liberar os óleos essenciais',
            'tempo_segundos': 15,
            'tecnica': 'muddle',
            'observacao': 'Não macere demais para não amargar'
        })
        ordem += 1
    
    if tem_destilado:
        preparo.append({
            'ordem': ordem,
            'descricao': 'Adicione o destilado base',
            'tempo_segundos': 5,
            'tecnica': 'measure',
            'observacao': 'Use jigger para dosagem exata'
        })
        ordem += 1
    
    if tem_xarope:
        preparo.append({
            'ordem': ordem,
            'descricao': 'Adicione o xarope/doçura',
            'tempo_segundos': 5,
            'tecnica': 'measure',
            'observacao': 'Ajuste doçura ao gosto'
        })
        ordem += 1
    
    # Técnica principal
    if tem_fruta or tem_xarope:
        preparo.append({
            'ordem': ordem,
            'descricao': 'Adicione gelo e shake vigorosamente por 10-15 segundos',
            'tempo_segundos': 15,
            'tecnica': 'shake',
            'observacao': 'Shake até o shaker ficar bem gelado'
        })
        ordem += 1
        
        preparo.append({
            'ordem': ordem,
            'descricao': 'Coe duplo (double strain) para o copo',
            'tempo_segundos': 5,
            'tecnica': 'strain',
            'observacao': 'Use coador fino para remover pedaços de fruta/gelo'
        })
        ordem += 1
    else:
        preparo.append({
            'ordem': ordem,
            'descricao': 'Adicione gelo e mexa delicadamente com bar spoon',
            'tempo_segundos': 20,
            'tecnica': 'stir',
            'observacao': 'Mexa até diluição ideal (cerca de 20-30 voltas)'
        })
        ordem += 1
        
        preparo.append({
            'ordem': ordem,
            'descricao': 'Coe para o copo',
            'tempo_segundos': 3,
            'tecnica': 'strain',
            'observacao': ''
        })
        ordem += 1
    
    # Finalização
    preparo.append({
        'ordem': ordem,
        'descricao': 'Finalize com guarnição adequada',
        'tempo_segundos': 10,
        'tecnica': 'garnish',
        'observacao': 'Guarnição complementa aroma e visual'
    })
    
    return preparo


def gerar_armazenamento_padrao(produto: Produto) -> List[dict]:
    """Gera instruções de armazenamento padrão."""
    armazenamento = []
    
    if produto.teor_alcoolico is not None and produto.teor_alcoolico > 0:
        armazenamento.append({
            'tipo': 'geladeira',
            'temperatura_min': 2,
            'temperatura_max': 8,
            'tempo_maximo_dias': 3,
            'observacao': 'Manter resfriado para melhor experiência. Consumir em até 3 dias após preparado.'
        })
    else:
        armazenamento.append({
            'tipo': 'geladeira',
            'temperatura_min': 2,
            'temperatura_max': 8,
            'tempo_maximo_dias': 2,
            'observacao': 'Consumir em até 48h. Manter coberto.'
        })
    
    return armazenamento


def gerar_harmonizacao_padrao(produto: Produto) -> List[dict]:
    """Gera sugestões de harmonização baseadas na categoria."""
    harmonizacao = []
    
    cat = (produto.categoria or '').lower()
    
    if 'drink' in cat or 'coquetel' in cat or 'cocktail' in cat:
        if 'cítrico' in (produto.descricao or '').lower() or 'limão' in (produto.descricao or '').lower():
            harmonizacao.append({'descricao': 'Ceviche, ostras, peixes brancos', 'tipo': 'entrada'})
            harmonizacao.append({'descricao': 'Saladas leves com molho cítrico', 'tipo': 'entrada'})
        elif 'doce' in (produto.descricao or '').lower() or 'fruta' in (produto.descricao or '').lower():
            harmonizacao.append({'descricao': 'Sobremesas à base de frutas, sorvetes', 'tipo': 'sobremesa'})
            harmonizacao.append({'descricao': 'Queijos leves (brie, camembert)', 'tipo': 'entrada'})
        else:
            harmonizacao.append({'descricao': 'Petiscos de bar (amendoim, batata frita, pastéis)', 'tipo': 'petisco'})
            harmonizacao.append({'descricao': 'Carnes grelhadas, hambúrgueres', 'tipo': 'prato_principal'})
    
    elif 'cerveja' in cat:
        harmonizacao.append({'descricao': 'Carnes grelhadas, churrasco', 'tipo': 'prato_principal'})
        harmonizacao.append({'descricao': 'Petiscos fritos (batata, pastel, bolinho)', 'tipo': 'petisco'})
        harmonizacao.append({'descricao': 'Queijos curados', 'tipo': 'entrada'})
    
    elif 'vinho' in cat:
        harmonizacao.append({'descricao': 'Queijos variados, charcutaria', 'tipo': 'entrada'})
        harmonizacao.append({'descricao': 'Massas, risotos, carnes assadas', 'tipo': 'prato_principal'})
    
    elif 'destilado' in cat or 'whisky' in cat or 'cachaça' in cat:
        harmonizacao.append({'descricao': 'Chocolates amargos, charutos', 'tipo': 'sobremesa'})
        harmonizacao.append({'descricao': 'Carnes de caça, defumados', 'tipo': 'prato_principal'})
    
    if not harmonizacao:
        harmonizacao.append({'descricao': 'Consulte o bartender para sugestões personalizadas', 'tipo': 'geral'})
    
    return harmonizacao


@router.get("/", response_model=List[FichaTecnicaItem])
def listar_fichas_tecnicas(
    categoria: Optional[str] = Query(default=None),
    tag: Optional[str] = Query(default=None),
    alergeno_excluir: Optional[str] = Query(default=None),
    dificuldade: Optional[str] = Query(default=None),
    teor_alcoolico_max: Optional[float] = Query(default=None),
    preco_max: Optional[float] = Query(default=None),
    apenas_ativos: bool = Query(default=True),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todas as fichas técnicas com filtros inteligentes."""
    query = db.query(Produto)
    
    if apenas_ativos:
        query = query.filter(Produto.ativo == True)
    
    if categoria:
        query = query.filter(Produto.categoria == categoria)
    
    if preco_max:
        query = query.filter(Produto.preco_venda <= preco_max)
    
    if teor_alcoolico_max is not None:
        query = query.filter(Produto.teor_alcoolico <= teor_alcoolico_max)
    
    produtos = query.order_by(Produto.categoria, Produto.nome).all()
    
    resultados = []
    for produto in produtos:
        # Buscar receita
        receitas = db.query(Receita).filter(Receita.produto_id == produto.id).all()
        
        # Ingredientes
        ingredientes = []
        for r in receitas:
            insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
            if insumo:
                ingredientes.append({
                    'insumo_id': insumo.id,
                    'nome': insumo.nome,
                    'quantidade': r.quantidade_necessaria,
                    'unidade_medida': insumo.unidade_medida,
                    'custo_unitario': insumo.custo_unitario or 0
                })
        
        # Custo e margem
        custo_total = calcular_custo_total(db, produto.id)
        margem = calcular_margem_lucro(produto.preco_venda, custo_total)
        
        # Nutricional
        nutricional = estimar_informacoes_nutricionais(db, produto.id)
        
        # Tags e alérgenos
        tags, alergenos = gerar_tags_inteligentes(db, produto, receitas)
        
        # Filtrar por tag
        if tag and tag not in tags:
            continue
        
        # Filtrar por alérgeno a excluir
        if alergeno_excluir and alergeno_excluir in alergenos:
            continue
        
        # Filtrar por dificuldade
        if dificuldade and produto.dificuldade != dificuldade:
            continue
        
        # Preparo
        preparo = gerar_preparo_padrao(db, produto, receitas)
        
        # Armazenamento
        armazenamento = gerar_armazenamento_padrao(produto)
        
        # Harmonização
        harmonizacao = gerar_harmonizacao_padrao(produto)
        
        ficha = FichaTecnicaItem(
            produto_id=produto.id,
            nome=produto.nome,
            categoria=produto.categoria,
            descricao=produto.descricao,
            preco_venda=produto.preco_venda,
            codigo_barras=produto.codigo_barras,
            foto_url=produto.foto_url,
            imagem=produto.imagem,
            teor_alcoolico=produto.teor_alcoolico,
            dificuldade=produto.dificuldade,
            custo_total=custo_total,
            margem_lucro=margem,
            ingredientes=ingredientes,
            preparo=preparo,
            armazenamento=armazenamento,
            harmonizacao=harmonizacao,
            calorias_estimadas=nutricional['calorias_estimadas'],
            carboidratos_g=nutricional['carboidratos_g'],
            proteinas_g=nutricional['proteinas_g'],
            gorduras_g=nutricional['gorduras_g'],
            tags=tags,
            alergenos=alergenos,
            criado_em=produto.created_at.isoformat() if hasattr(produto, 'created_at') and produto.created_at else None,
            atualizado_em=produto.updated_at.isoformat() if hasattr(produto, 'updated_at') and produto.updated_at else None,
            versao=1
        )
        resultados.append(ficha)
    
    return resultados[offset:offset + limit]


@router.get("/{produto_id}", response_model=FichaTecnicaItem)
def obter_ficha_tecnica(
    produto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Obtém a ficha técnica completa de um produto específico."""
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Reutilizar a lógica da listagem
    receitas = db.query(Receita).filter(Receita.produto_id == produto.id).all()
    
    ingredientes = []
    for r in receitas:
        insumo = db.query(Insumo).filter(Insumo.id == r.insumo_id).first()
        if insumo:
            ingredientes.append({
                'insumo_id': insumo.id,
                'nome': insumo.nome,
                'quantidade': r.quantidade_necessaria,
                'unidade_medida': insumo.unidade_medida,
                'custo_unitario': insumo.custo_unitario or 0
            })
    
    custo_total = calcular_custo_total(db, produto.id)
    margem = calcular_margem_lucro(produto.preco_venda, custo_total)
    nutricional = estimar_informacoes_nutricionais(db, produto.id)
    tags, alergenos = gerar_tags_inteligentes(db, produto, receitas)
    preparo = gerar_preparo_padrao(produto, receitas)
    armazenamento = gerar_armazenamento_padrao(produto)
    harmonizacao = gerar_harmonizacao_padrao(produto)
    
    return FichaTecnicaItem(
        produto_id=produto.id,
        nome=produto.nome,
        categoria=produto.categoria,
        descricao=produto.descricao,
        preco_venda=produto.preco_venda,
        codigo_barras=produto.codigo_barras,
        foto_url=produto.foto_url,
        imagem=produto.imagem,
        teor_alcoolico=produto.teor_alcoolico,
        dificuldade=produto.dificuldade,
        custo_total=custo_total,
        margem_lucro=margem,
        ingredientes=ingredientes,
        preparo=preparo,
        armazenamento=armazenamento,
        harmonizacao=harmonizacao,
        calorias_estimadas=nutricional['calorias_estimadas'],
        carboidratos_g=nutricional['carboidratos_g'],
        proteinas_g=nutricional['proteinas_g'],
        gorduras_g=nutricional['gorduras_g'],
        tags=tags,
        alergenos=alergenos,
        versao=1
    )


@router.get("/categorias/lista")
def listar_categorias(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista categorias únicas de produtos ativos."""
    categorias = db.query(Produto.categoria).filter(
        Produto.ativo == True,
        Produto.categoria.isnot(None)
    ).distinct().all()
    return [c[0] for c in categorias if c[0]]


@router.get("/tags/lista")
def listar_tags(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todas as tags disponíveis no sistema."""
    # Tags pré-definidas do sistema
    tags_sistema = [
        'classico', 'signature', 'sem_alcool', 'baixo_teor', 'alto_teor',
        'vegano', 'sem_gluten', 'baixo_calorico', 'organico'
    ]
    return tags_sistema


@router.get("/alergenos/lista")
def listar_alergenos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Lista todos os alérgenos possíveis."""
    alergenos_sistema = [
        'gluten', 'lactose', 'soja', 'nozes', 'crustaceos', 'ovos', 'peixe', 'amendoim'
    ]
    return alergenos_sistema