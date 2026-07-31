"""
BARIZE - Seed do Checklist (POPs) completo
Popula o banco com o checklist profissional dividido por períodos
(Diário, Semanal, Mensal) e adaptado por fluxo (Baixo, Médio, Alto).

Uso: python -m scripts.seed_pops
Idempotente: atualiza itens existentes pelo título e cria os novos.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_engine, SessionLocal, init_db
from app.models.pop import POP

SEMPRE = {"baixo": "sempre", "medio": "sempre", "alto": "sempre"}
BAIXO_OPC = {"baixo": "opcional", "medio": "sempre", "alto": "sempre"}
ALTO_OBRIG = {"baixo": "nao_aplicavel", "medio": "nao_aplicavel", "alto": "sempre"}

# (titulo, descricao, setor, frequencia, momento, exigencia_fluxo)
ITENS = [
    # ─── DIÁRIO · ABERTURA ───
    ("Ligar equipamentos do bar (geladeiras, máquina de gelo, moedor) e conferir funcionamento", "Conferir que todos os equipamentos ligam e estão operando normalmente", "Bar", "diario", "abertura", SEMPRE),
    ("Registrar temperatura das geladeiras do bar", "Anotar temperatura e validar faixa segura (4°C ou menos)", "Bar", "diario", "abertura", SEMPRE),
    ("Conferir estoque de gelo e acionar reposição", "Garantir volume suficiente para o serviço do dia", "Bar", "diario", "abertura", SEMPRE),
    ("Higienizar e secar bancada e balcão do bar", "Limpeza com produto sanitizante antes de iniciar o serviço", "Bar", "diario", "abertura", SEMPRE),
    ("Dispor guarnições e frutas (cortar/repor) para o serviço", "Preparar limões, frutas e guarnições conforme previsão do dia", "Bar", "diario", "abertura", BAIXO_OPC),
    ("Testar torneiras de chopp e pressão dos barris", "Conferir fluxo, pressão e temperatura do chopp", "Bar", "diario", "abertura", ALTO_OBRIG),
    ("Conferir copos e taças higienizados em quantidade suficiente", "Garantir estoque de louça limpa para o pico de serviço", "Bar", "diario", "abertura", SEMPRE),
    ("Conferir troco inicial e comunicar divergência ao caixa", "Validar o valor do fundo de troco", "Bar", "diario", "abertura", SEMPRE),
    ("Ligar e testar equipamentos da cozinha (fogão, chapa, fritadeira, forno, pass-through)", "Testar ignição e funcionamento de todos os equipamentos", "Cozinha", "diario", "abertura", SEMPRE),
    ("Verificar temperatura da fritadeira (óleo entre 170–180 °C)", "Ajustar termostato antes do primeiro uso do dia", "Cozinha", "diario", "abertura", SEMPRE),
    ("Registrar temperatura das câmaras frias", "Anotar temperatura de câmaras e validar faixa segura", "Cozinha", "diario", "abertura", SEMPRE),
    ("Conferir mise en place do dia e validade de perecíveis da bancada", "Validar pré-preparos, porções e validades antes do serviço", "Cozinha", "diario", "abertura", SEMPRE),
    ("Higienizar bancada, tábuas e facas antes do primeiro preparo", "Sanitizar superfícies de contato com alimentos", "Cozinha", "diario", "abertura", SEMPRE),
    ("Conferir uniforme, touca e luvas da equipe", "Validar EPIs e higiene pessoal da equipe de cozinha", "Cozinha", "diario", "abertura", ALTO_OBRIG),
    ("Organizar salão: mesas, cadeiras e reposição de descartáveis", "Dispor mesas e abastecer guardanapos e descartáveis", "Salão", "diario", "abertura", SEMPRE),
    ("Conferir cardápios físicos e QR codes (integridade)", "Validar cardápios e links do cardápio digital", "Salão", "diario", "abertura", BAIXO_OPC),
    ("Testar iluminação, som e ar-condicionado do salão", "Conferir climatização e ambiente pronto para receber clientes", "Salão", "diario", "abertura", BAIXO_OPC),
    ("Verificar banheiros: papel, sabonete, toalha e limpeza", "Conferir insumos e higiene dos banheiros", "Higiene", "diario", "abertura", SEMPRE),
    ("Abrir caixa no sistema e registrar fundo de troco", "Registrar abertura de caixa e valor inicial", "Caixa", "diario", "abertura", SEMPRE),
    ("Testar maquininha de cartão e impressora", "Validar conectividade e impressão de testes", "Caixa", "diario", "abertura", SEMPRE),

    # ─── DIÁRIO · DURANTE O SERVIÇO ───
    ("Higienizar bancada do bar após cada uso intenso", "Sanitizar bancada nos intervalos de pico", "Bar", "diario", "durante", SEMPRE),
    ("Repor gelo e guarnições no balcão", "Reposição ativa conforme consumo durante o serviço", "Bar", "diario", "durante", ALTO_OBRIG),
    ("Checar validade de perecíveis expostos (frutas, sucos, leite)", "Retirar itens vencidos ou com aspecto alterado", "Bar", "diario", "durante", ALTO_OBRIG),
    ("Higienizar bancada da cozinha entre preparos", "Limpar e sanitizar superfície a cada troca de preparo", "Cozinha", "diario", "durante", SEMPRE),
    ("Trocar tábuas e utensílios entre alimentos crus e cozidos", "Prevenir contaminação cruzada", "Cozinha", "diario", "durante", ALTO_OBRIG),
    ("Verificar temperatura de alimentos quentes em exposição (acima de 60 °C)", "Monitorar balcão térmico e exposição de quentes", "Cozinha", "diario", "durante", ALTO_OBRIG),
    ("Repor mise en place durante o serviço", "Reposição de pré-preparos conforme demanda", "Cozinha", "diario", "durante", SEMPRE),
    ("Descartar perecíveis vencidos e registrar a baixa", "Registrar descarte no sistema de estoque", "Cozinha", "diario", "durante", ALTO_OBRIG),
    ("Repor descartáveis e limpar mesas após saída de clientes", "Manter salão organizado e mesas prontas", "Salão", "diario", "durante", SEMPRE),
    ("Ronda de banheiros: papel, sabonete e limpeza", "Conferir banheiros nos intervalos de serviço", "Higiene", "diario", "durante", BAIXO_OPC),
    ("Limpar derramamentos no piso imediatamente", "Evitar acidentes e sujeira acumulada", "Salão", "diario", "durante", SEMPRE),
    ("Conferir fechamentos parciais de caixa e sangrias", "Validar sangrias e lançamentos no caixa", "Caixa", "diario", "durante", ALTO_OBRIG),

    # ─── DIÁRIO · FECHAMENTO ───
    ("Higienizar bancada, torneiras, dosadores e equipamentos do bar", "Limpeza completa do bar ao final do expediente", "Bar", "diario", "fechamento", SEMPRE),
    ("Descartar guarnições e perecíveis abertos vencidos", "Descartar sobras vencidas e registrar baixa", "Bar", "diario", "fechamento", SEMPRE),
    ("Organizar cargas do bar e lacrar geladeiras", "Organizar produtos e fechar câmaras", "Bar", "diario", "fechamento", SEMPRE),
    ("Limpar e coar fritadeira; desligar equipamentos (exceto câmaras)", "Limpeza da fritadeira e desligamento seguro", "Cozinha", "diario", "fechamento", SEMPRE),
    ("Higienizar chapa, fogão, forno e bancadas", "Limpeza completa dos equipamentos da cozinha", "Cozinha", "diario", "fechamento", SEMPRE),
    ("Guardar insumos em câmaras e lacrar; descartar sobras vencidas", "Guardar perecíveis e descartar vencidos", "Cozinha", "diario", "fechamento", SEMPRE),
    ("Limpeza final do piso da cozinha", "Varrer e sanitizar piso da cozinha", "Cozinha", "diario", "fechamento", ALTO_OBRIG),
    ("Recolher mesas, limpar e reorganizar o salão", "Salão pronto para o próximo dia", "Salão", "diario", "fechamento", SEMPRE),
    ("Varrer e passar pano no salão", "Limpeza final do piso do salão", "Salão", "diario", "fechamento", ALTO_OBRIG),
    ("Retirar lixo e higienizar lixeiras internas", "Descarte de resíduos e limpeza de lixeiras", "Salão", "diario", "fechamento", SEMPRE),
    ("Conferência final de caixa e registro de fechamento no sistema", "Fechar caixa e conferir valores", "Caixa", "diario", "fechamento", SEMPRE),
    ("Guardar numerário no cofre e destinar valores de fornecedores", "Segurança do numerário ao final do dia", "Caixa", "diario", "fechamento", ALTO_OBRIG),
    ("Desligar luzes, fechar portas e janelas e acionar travas", "Conferir fechamento seguro do estabelecimento", "Segurança", "diario", "fechamento", SEMPRE),
    ("Ativar alarme e verificar câmeras", "Acionar sistema de segurança", "Segurança", "diario", "fechamento", ALTO_OBRIG),
    ("Conferir saída de emergência desobstruída e extintor acessível", "Validar segurança contra incêndio", "Segurança", "diario", "fechamento", ALTO_OBRIG),

    # ─── SEMANAL ───
    ("Limpeza profunda do bar: prateleiras, gavetas, espelhos e balcão", "Higienização detalhada de toda a área do bar", "Bar", "semanal", None, SEMPRE),
    ("Higienizar linhas e mangueiras de chopp", "Limpeza do sistema de chopp", "Bar", "semanal", None, ALTO_OBRIG),
    ("Lavar e organizar copos, taças e utensílios especiais", "Organizar louça e utensílios", "Bar", "semanal", None, SEMPRE),
    ("Descalcificar máquina de café e moedor (se houver)", "Manutenção de equipamentos de café", "Bar", "semanal", None, BAIXO_OPC),
    ("Conferir validade de bebidas abertas e lacres", "Validar bebidas abertas e lacradas", "Bar", "semanal", None, SEMPRE),
    ("Limpeza profunda das câmaras frias: organizar, conferir validade e descongelar", "Organização e validade das câmaras", "Cozinha", "semanal", None, SEMPRE),
    ("Higienizar coifa e filtros do exaustor", "Limpeza do sistema de exaustão", "Cozinha", "semanal", None, ALTO_OBRIG),
    ("Coar ou trocar óleo da fritadeira", "Manutenção do óleo da fritadeira", "Cozinha", "semanal", None, SEMPRE),
    ("Organizar despensa e conferir validade de estoque seco", "Organização e validade da despensa", "Estoque", "semanal", None, SEMPRE),
    ("Conferir utensílios danificados e necessidade de reposição (facas, panelas, bandejas)", "Levantar necessidades de reposição", "Cozinha", "semanal", None, SEMPRE),
    ("Limpeza profunda do salão: pisos, rodapés e vidros", "Higienização detalhada do salão", "Salão", "semanal", None, BAIXO_OPC),
    ("Higienizar cadeiras, almofadas e tecidos do salão", "Limpeza de assentos e tecidos", "Salão", "semanal", None, BAIXO_OPC),
    ("Verificar lâmpadas queimadas e substituir", "Manutenção de iluminação", "Salão", "semanal", None, BAIXO_OPC),
    ("Conferência de estoque de bebidas: perdas, quebras e FIFO", "Conferir perdas e aplicar FIFO", "Estoque", "semanal", None, SEMPRE),
    ("Inventário rotativo de insumos de alto giro", "Contagem de insumos de maior giro", "Estoque", "semanal", None, SEMPRE),
    ("Conferir material de limpeza e descartáveis para a semana", "Garantir insumos operacionais", "Estoque", "semanal", None, SEMPRE),
    ("Conciliar fechamentos de caixa da semana", "Conferência dos caixas da semana", "Caixa", "semanal", None, SEMPRE),
    ("Limpeza profunda dos banheiros: paredes, rejunte e lixeiras", "Higienização detalhada dos banheiros", "Higiene", "semanal", None, SEMPRE),
    ("Testar alarme, sensores e câmeras", "Teste do sistema de segurança", "Segurança", "semanal", None, ALTO_OBRIG),
    ("Verificar pressão e lacre dos extintores", "Inspeção visual dos extintores", "Segurança", "semanal", None, SEMPRE),

    # ─── MENSAL ───
    ("Inventário físico completo de bebidas e insumos (conferir com sistema)", "Inventário geral do mês", "Estoque", "mensal", None, SEMPRE),
    ("Revisão de estoque morto: itens parados há mais de 30 dias e plano de giro", "Identificar itens parados e propor giro", "Estoque", "mensal", None, SEMPRE),
    ("Avaliar fornecedores: prazos, preços e qualidade dos últimos 30 dias", "Revisão mensal de fornecedores", "Compras", "mensal", None, SEMPRE),
    ("Análise financeira do mês: DRE, custos, desperdício e quebras", "Revisar resultado financeiro do mês", "Financeiro", "mensal", None, SEMPRE),
    ("Manutenção preventiva: geladeiras, fritadeira, ar-condicionado e sistema de chopp", "Manutenção preventiva dos equipamentos críticos", "Manutenção", "mensal", None, SEMPRE),
    ("Treinamento da equipe: item novo do cardápio, atendimento e segurança", "Capacitação da equipe", "Gestão", "mensal", None, SEMPRE),
    ("Verificar validade de licenças, alvarás e certificações", "Conferir documentação legal do estabelecimento", "Gestão", "mensal", None, SEMPRE),
    ("Conferir seguro e vistoria dos extintores (recarga/laudo)", "Vistoria de segurança contra incêndio", "Segurança", "mensal", None, SEMPRE),
    ("Atualizar fichas técnicas e precificação de itens do cardápio", "Atualizar custos e preços", "Gestão", "mensal", None, SEMPRE),
    ("Revisar este checklist: itens obsoletos e novos procedimentos", "Melhoria contínua do checklist", "Gestão", "mensal", None, SEMPRE),
    ("Descongelamento e limpeza total das câmaras", "Limpeza profunda mensal das câmaras", "Estoque", "mensal", None, BAIXO_OPC),
    ("Avaliar itens menos vendidos do cardápio e propor ajustes", "Análise do mix de vendas do mês", "Gestão", "mensal", None, ALTO_OBRIG),
]


def seed():
    init_db()
    db = SessionLocal()

    try:
        criados = 0
        atualizados = 0
        for i, (titulo, descricao, setor, frequencia, momento, exigencia) in enumerate(ITENS, start=1):
            pop = db.query(POP).filter(POP.titulo == titulo).first()
            if pop:
                pop.descricao = descricao
                pop.setor = setor
                pop.frequencia = frequencia
                pop.momento = momento
                pop.exigencia_fluxo = exigencia
                pop.ordem = i
                pop.ativo = 1
                atualizados += 1
            else:
                db.add(POP(
                    titulo=titulo,
                    descricao=descricao,
                    categoria=None,
                    passos=[],
                    frequencia=frequencia,
                    momento=momento,
                    exigencia_fluxo=exigencia,
                    setor=setor,
                    ordem=i,
                    ativo=1,
                ))
                criados += 1
        db.commit()
        print(f"[SEED-POPS] {criados} itens criados, {atualizados} atualizados. Total: {len(ITENS)}")
    except Exception as e:
        db.rollback()
        print(f"[SEED-POPS] Erro: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
