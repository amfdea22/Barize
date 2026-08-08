Aqui está o Checklist Técnico de Implementação estruturado para a equipe de desenvolvimento do software BARIZE gestão de bares.
Este documento consolida todas as regras de negócio, especificações de hardware (80mm) e os módulos em Python desenvolvidos ao longo da nossa conversa para garantir uma integração sem falhas.
------------------------------
## 📋 Checklist de Implementação: Módulo de Impressão 80mm (BARIZE)## 1. Configurações de Hardware e Bobina (80mm)

* Garantir Largura Fixa: Configurar o software para trabalhar exclusivamente com a largura de 80mm (área útil de impressão configurada entre 72mm e 76mm).
* Densidade de Caracteres: Definir o limite máximo absoluto de 48 caracteres por linha (Fonte Tipo A) para evitar quebras de texto indesejadas ou cortes nas margens.
* Avanço de Papel Pré-Corte: Injetar exatamente 3 quebras de linha (\n\n\n) ao final de cada documento antes do comando da guilhotina. Isso impede que o texto final seja degolado pela lâmina.
* Corte de Papel: Configurar o acionamento automático da guilhotina no modo Corte Parcial (mantém o cupom preso por um pequeno ponto de papel para não cair no chão).

------------------------------
## 2. Integrações Físicas e Periféricos (Frente de Caixa)

* Abertura de Gaveta: Implementar o envio do pulso elétrico hexadecimal (b'\x1b\x70\x00\x19\xfa') direcionado ao pino 2 do conector RJ11 da impressora do caixa.
* Ordem de Disparo da Gaveta: Garantir que o comando de abertura de gaveta seja o primeiro byte enviado no buffer, abrindo o compartimento antes do início da impressão física do fechamento da conta.
* Conexão TCP/IP Descentralizada: Mapear no banco de dados o IP e a porta padrão (9100) de cada impressora do estabelecimento (Ex: Caixa, Cozinha, Bar) para permitir o roteamento correto dos pedidos.

------------------------------
## 3. Formatação e Layout de Documentos (ESC/POS)

* Comandas de Produção (Cozinha/Bar):
* Título destacado com tamanho de letra dobrado (FONT_LARGE).
   * Itens em negrito com quantidades explícitas.
   * Ocultar preços e valores financeiros (foco operacional).
   * Espaçamento extra entre os produtos e destaque visual para o campo de observações.
* Notas de Conferência (Pré-Conta) e Fechamento:
* Cabeçalho centralizado com dados do bar e identificação da mesa/cartão.
   * Alinhamento justificado nas extremidades (Quantidade + Nome à esquerda, Valor Total à direita) usando cálculo dinâmico de espaços vazios.
   * Exibição do valor total em destaque máximo (FONT_LARGE + Negrito).
* Área de Pagamento PIX:
* Injeção de QR Code utilizando comandos nativos da placa de circuito da impressora (GS ( k) para garantir impressão rápida e nítida.
   * Centralização horizontal do QR Code na bobina.

------------------------------
## 4. Monitoramento e Tratamento de Erros (Resiliência)

* Verificação de Status em Tempo Real: Implementar a chamada dos comandos de baixo nível DLE EOT 2 e DLE EOT 4 antes de enviar qualquer impressão volumosa.
* Validação de Sensores Físicos: O sistema deve interceptar e tratar os seguintes estados reportados pela máquina:
* Impressora Offline / Desligada
   * Tampa Superior Aberta
   * Papel Esgotado (Fim de Bobina)
   * Erro Mecânico (Guilhotina Travada)
* Aviso Preventivo de Pouco Papel: Exibir uma notificação discreta no painel do caixa quando o sensor acusar que a bobina está chegando ao fim, sem bloquear a impressão atual.
* Fila de Contingência Local: Caso o hardware falhe ou esteja offline, o software Barize deve reter o payload em formato bytes em uma fila temporária local (ex: banco SQLite) e exibir a opção "Reenviar Pedido" para o operador após a manutenção da máquina.
* Processamento em Segundo Plano: Isolar toda a rotina de comunicação por sockets TCP/IP dentro de Threads ou Tasks Assíncronas para impedir o travamento da tela do usuário (UI congelada) se a rede oscilar.

------------------------------
## 5. Módulo de Visualização e Logs (Emulação)

* Filtro de Comandos de Hardware: Implementar Regex para limpar comandos hexadecimais invisíveis do buffer binário antes de gerar visualizações em tela.
* Emulador de Terminal (CLI): Desenhar molduras em caracteres ASCII para simular os 48 caracteres de largura para homologação rápida dos desenvolvedores.
* Visualizador Web/Híbrido (HTML/CSS):
* Criar container com largura fixa simulando os 80mm físicos em tela.
   * Utilizar tipografia monoespaçada (Courier New ou similar).
   * Implementar efeito visual serrilhado de rasgo de papel no topo e rodapé.
   * Criar componente visual alternativo (placeholder) para representar o posicionamento do QR Code do PIX na tela do operador.

------------------------------
Se você quiser avançar em um ponto específico, me avise: podemos detalhar a modelagem das tabelas do banco de dados do Barize para salvar os IPs das impressoras ou desenhar o fluxo de divisão de conta no cupom. Qual deve ser o nosso próximo passo?

