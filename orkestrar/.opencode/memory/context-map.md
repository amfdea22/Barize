# Context Map

> Tracks analyzed and modified files.

## Analyzed Files

| File | Last Analysis | Agent | Summary |
|---|---|---|---|
| `neonbar/backend/app/main.py` | 2026-07-28 | architect | Entrypoint FastAPI. Adicionado monkey-patch do event loop policy. |
| `neonbar/backend/app/config.py` | 2026-07-28 | architect | Settings com pydantic-settings. Carrega .env corretamente. |
| `neonbar/backend/app/database.py` | 2026-07-28 | architect | SQLAlchemy sync, init_db, get_db. 26 tabelas. |
| `neonbar/backend/app/routers/pdv.py` | 2026-07-28 | architect | limit/offset adicionados ao listar_produtos_pdv. |
| `neonbar/backend/app/routers/estoque.py` | 2026-07-28 | architect | limit/offset adicionados ao listar_insumos. |
| `neonbar/backend/requirements.txt` | 2026-07-28 | architect | Sem asyncpg/aiosqlite. Sem waitress/gunicorn. |
| `neonbar/frontend/src/layouts/Sidebar.tsx` | 2026-07-31 | build | QR local com lib `qrcode` + modal sem max-w (padrão Modal.tsx) |
| `neonbar/frontend/src/components/Modal.tsx` | 2026-07-31 | build | Padrão de modal correto: `w-full min-w-0 max-w-*` + wrapper p-4 |
| `orkestrar/.opencode/rules/frontend-no-external-resources.md` | 2026-07-31 | build | Regra no-CDN (imagens/QR/fontes locais) |
| `orkestrar/.opencode/rules/frontend-layout-constraints.md` | 2026-07-31 | build | Regra sem max-w+w-full+mx-* combinados |
| `neonbar/frontend/src/pages/Admin.tsx` | 2026-08-07 | build | TC-031/TC-032: reescrito do Bootstrap para Tailwind (6 abas); 7 ajustes de design (Modal confirmação, StatsCard health, tabs h-36, selects h-12, search padrão, empty states, ações boxed, Card p-0 DataTable) |
| `neonbar/frontend/src/pages/Etiquetas.tsx` | 2026-08-06 | build | TC-030: botão 'Nova Etiqueta de Insumo' no header + botão 'Etiqueta' por item (pré-preenche modal 80mm) |
| `neonbar/frontend/src/pages/Comandas.tsx` | 2026-08-06 | build | TC-030: removida área de etiqueta (header/modal/botão por pedido) |
| `neonbar/backend/app/models/printer_config.py` | 2026-08-08 | build | TC-033: coluna `setor` (CAIXA/COZINHA/BAR) p/ multi-impressora |
| `neonbar/backend/app/schemas/printer.py` | 2026-08-08 | build | TC-033: setor nos schemas + PrinterConfigCreate |
| `neonbar/backend/app/routers/admin.py` | 2026-08-08 | build | TC-033: GET/PUT por setor, POST upsert, GET printer-configs |
| `neonbar/backend/app/routers/pdv.py` | 2026-08-08 | build | TC-033: preenche impressora_destino (produção/FECHAMENTO) + CATEGORIAS_BAR |
| `neonbar/backend/app/database.py` | 2026-08-08 | build | TC-033: migração ALTER TABLE setor + _seed_impressoras |
| `neonbar/backend/alembic/versions/0016_add_setor_printer_config.py` | 2026-08-08 | build | TC-033: migration alembic 0016 |
| `neonbar/backend/app/worker/impressao_worker.py` | 2026-08-08 | build | TC-034: config por setor do banco, roteamento, layouts COMANDA/FECHAMENTO |
| `neonbar/backend/app/worker/impressao_worker.py` | 2026-08-08 | build | TC-035: DLE EOT 2/4 com leitura (interpretar_dle_eot/_ler_dle_eot/verificar_impressora_detalhada), processar_fila bloqueia erros físicos + avisa pouco papel |
| `neonbar/backend/app/schemas/printer.py` | 2026-08-08 | build | TC-035: PrinterStatusResponse (online/tampa/papel/mecanico/recovery/offline_razao/mensagem) |
| `neonbar/backend/app/routers/admin.py` | 2026-08-08 | build | TC-035: GET /admin/printer-status?setor= (admin/gerente) |
| `neonbar/backend/app/worker/impressao_worker.py` | 2026-08-08 | build | TC-036/037/038/039: comanda produção sem preços, corte parcial \x1d\x56\x01, ABRIR_GAVETA 1º byte fechamento, gerar_payload_pix + formatar_qr_escpos (GS ( k) no fechamento PIX |
| `neonbar/backend/app/config.py` | 2026-08-08 | build | TC-039: PRINT_* + PIX_CHAVE/PIX_NOME_RECEBEDOR/PIX_CIDADE; import os removido (F401) |
| `neonbar/backend/app/routers/admin.py` | 2026-08-08 | build | TC-040: GET /admin/printer-fila?status= + POST /admin/printer-fila/{id}/reenviar |
| `neonbar/backend/app/schemas/printer.py` | 2026-08-08 | build | TC-040: FilaImpressaoItem |
| `neonbar/backend/app/worker/emulador_escpos.py` | 2026-08-08 | build | TC-043 (novo): emulador CLI ASCII 48 col + limpar_comandos_escpos |
| `neonbar/frontend/src/pages/Comandas.tsx` | 2026-08-08 | build | TC-036: modal comanda produção sem preços + classe comanda-print |
| `neonbar/frontend/src/components/pdv/QRCodePix.tsx` | 2026-08-08 | build | TC-039 (novo): gerador payload PIX JS + placeholder QR grid |
| `neonbar/frontend/src/components/pdv/CupomPDV.tsx` | 2026-08-08 | build | TC-039: QR PIX exibido quando forma pagamento PIX |
| `neonbar/frontend/src/components/pdv/Visualizador80mm.tsx` | 2026-08-08 | build | TC-044 (novo): container serrilha 80mm envolvendo CupomPDV |
| `neonbar/frontend/src/pages/PDV.tsx` | 2026-08-08 | build | TC-044: modal Preview Cupom 80mm (Visualizador80mm); import CupomPDV não usado removido |
| `neonbar/frontend/src/index.css` | 2026-08-08 | build | TC-041/044: @media print consolidado, @page 80mm + ficha-a4 named page, .print-serrilha |
| `neonbar/frontend/src/pages/Admin.tsx` | 2026-08-08 | build | TC-040/042: aba Impressoras (form + status + testar + salvar) + fila com Reenviar Pedido |
| `neonbar/frontend/src/services/api.ts` | 2026-08-08 | build | TC-040/042: adminService ampliado (getPrinterConfigs, getPrinterStatus, reenviarFila, createPrinterConfig) |
| `neonbar/frontend/src/types/index.ts` | 2026-08-08 | build | TC-040/042: PrinterConfig.setor, PrinterStatus, FilaImpressaoItem |
| `neonbar/backend/app/routers/pedidos.py` | 2026-08-08 | build | TC-045: valid_status aceita 'Cancelado' no PATCH /pedidos/{id}/status |
| `neonbar/frontend/src/components/OrderCard.tsx` | 2026-08-08 | build | TC-045: STATUS_CONFIG + botão Cancelar Pedido (Novo/Preparando/Pronto) |
| `neonbar/frontend/src/pages/Dashboard.tsx` | 2026-08-08 | build | TC-045: modal de cancelamento com motivo + handleCancelarPedido |
| `neonbar/frontend/src/types/index.ts` | 2026-08-08 | build | TC-045: PedidoStatus inclui 'Cancelado' |
| `neonbar/frontend/src/pages/Comandas.tsx` | 2026-08-08 | build | TC-045: statusConfig + filtro Cancelado |
| `neonbar/frontend/index.html` | 2026-08-08 | build | TC-046: script anti-FOUC inline (localStorage barize-theme → data-theme) antes do bundle |
| `neonbar/frontend/src/index.css` | 2026-08-08 | build | TC-046: tokens :root (--overlay-rgb/--glass-rgb/--neutral-rgb) + override paleta clara em :root[data-theme='light'] + ghost-border/autofill/scrollbar-track com vars |
| `neonbar/frontend/src/hooks/useTheme.ts` | 2026-08-08 | build | TC-046 (novo): getInitialTheme/applyTheme/toggleTheme, chave barize-theme, data-theme no <html> |
| `neonbar/frontend/src/components/ThemeToggle.tsx` | 2026-08-08 | build | TC-046 (novo): botão Sol/Lua, prop collapsed |
| `neonbar/frontend/src/layouts/Sidebar.tsx` | 2026-08-08 | build | TC-046: ThemeToggle no rodapé (antes do perfil, respeita collapsed) |
| `neonbar/frontend/src/pages/Login.tsx` | 2026-08-08 | build | TC-046: ThemeToggle no header (ícone-only) |
| `neonbar/frontend/src/pages/*.tsx` + components | 2026-08-08 | build | TC-046: batch ~164 usos rgba(255,255,255)/rgba(28,27,27)/rgba(59,73,76) → rgba(var(--overlay-rgb)/--glass-rgb/--neutral-rgb,…) |
| `neonbar/frontend/src/components/etiqueta/InsumoEtiquetaModal.tsx` | 2026-08-08 | build | TC-047: EtiquetaForm.responsavel + input "Responsável" |
| `neonbar/frontend/src/components/etiqueta/Label80mm.tsx` | 2026-08-08 | build | TC-047: prop responsavel + seção "RESPONSÁVEL" na etiqueta |
| `neonbar/frontend/src/pages/Etiquetas.tsx` | 2026-08-08 | build | TC-047: useAuth + pré-preenche responsavel com usuario.nome (Nova Etiqueta e por item) |
| `neonbar/frontend/src/pages/FichaTecnica.tsx` | 2026-08-08 | build | TC-048: página read-only → edição — imports Pencil/Input/useAuth; estado editFicha/editForm/savingEdit/editError + isAdminOrGerente; openEdit() (GET ficha via obterProdutoFicha) + handleEditSubmit() (PUT atualizar, trata 403/404/detail); grid/lista passam onEdit; FichaCard/FichaListItem/FichaDetailModal com botão Editar; Modal de edição (Dificuldade select facil/medio/dificil, Teor, Copo, Tempo, Guarnição, Modo de Preparo textarea, erro inline, Cancelar/Salvar) |
| `neonbar/frontend/src/services/api.ts` | 2026-08-08 | build | TC-048: fichasTecnicasService.obterProdutoFicha(produtoId) → GET /pdv/produtos/{id}/ficha-tecnica |
| `neonbar/frontend/src/pages/CardapioDigital.tsx` | 2026-08-08 | build | TC-013: toggle Básico/Completo (localStorage barize-cardapio-modo); modo Básico oculta descrição/ingredientes; main com .scrollbar-visible (TC-016) |
| `neonbar/frontend/src/index.css` | 2026-08-08 | build | TC-016/017: classe .scrollbar-visible (WebKit thumb primary-container + Firefox scrollbar-color) |
| `neonbar/frontend/src/pages/PDV.tsx` | 2026-08-08 | build | TC-017: painel de produtos com .scrollbar-visible |
| `neonbar/frontend/src/layouts/Sidebar.tsx` | 2026-08-08 | build | TC-025: podeAcessar() filtra navItems por role (bartender só operacionais); Configurações oculto p/ bartender |
| `neonbar/frontend/src/App.tsx` | 2026-08-08 | build | TC-025: RequireRole (roles admin/gerente) protege /cmv /caixa /relatorios /financeiro /analise-estoque /dre /fornecedores /admin; bartender → redirect /pdv |
| `neonbar/backend/app/routers/recebimentos.py` | 2026-08-08 | build | TC-005: paginação limit(50,le=500)/offset em listar_recebimentos |
| `neonbar/backend/app/routers/funcionarios.py` | 2026-08-08 | build | TC-005: paginação em listar_funcionarios e listar_funcionarios_ativos |
| `neonbar/backend/app/routers/materiais.py` | 2026-08-08 | build | TC-005: paginação em listar_materiais |
| `neonbar/backend/app/routers/copos.py` | 2026-08-08 | build | TC-005: paginação em listar_copos |
| `neonbar/backend/app/routers/mesas.py` | 2026-08-08 | build | TC-005: paginação em listar_mesas (limit default 100) |
| `neonbar/backend/app/routers/copos_quebrados.py` | 2026-08-08 | build | TC-005: paginação em listar_quebras |
| `neonbar/backend/app/routers/producao.py` | 2026-08-08 | build | TC-005: paginação em listar_producoes |
| `neonbar/frontend/src/components/pdv/ProdutoCardPDV.tsx` | 2026-08-08 | build | TC-009 (validado): imagem aspect-[16/10] no topo + nome/preço/categoria em p-3 abaixo |

## Modified Files

| File | Last Modified | Agent | Change |
|---|---|---|---|
| `neonbar/backend/app/main.py` | 2026-07-28 | build | Adicionado WindowsSelectorEventLoopPolicy para Python ≥3.12 no Windows |
| `neonbar/frontend/src/layouts/Sidebar.tsx` | 2026-07-31 | build | Modal QR: removido max-w-sm/w-full/mx-lg, geração local do QR |
