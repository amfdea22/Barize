# BARIZE - Checklist de Go-Live

> Documento mestre para o dia da implantação do BARIZE no bar.

## 🟢 Pré-requisitos (H-7 dias)

### Infraestrutura
- [ ] Servidor dedicado adquirido e configurado
- [ ] Nobreak UPS senoidal instalado e testado
- [ ] Switch Gigabit com cabos CAT5e/6 passados
- [ ] IP fixo do servidor configurado no roteador
- [ ] DNS local (barize.local) funcionando
- [ ] Ventilação do local do servidor verificada

### Software
- [ ] Docker + Docker Compose instalados no servidor
- [ ] PostgreSQL configurado (container)
- [ ] Migrações Alembic executadas sem erro
- [ ] Dados de seed carregados (produtos, insumos, receitas)
- [ ] Frontend compilado e servido pelo Nginx
- [ ] Worker de impressão rodando e testado
- [ ] Worker de alertas rodando

### Segurança
- [ ] JWT_SECRET alterado (não usar o padrão)
- [ ] Senha do admin alterada
- [ ] POSTGRES_PASSWORD alterado
- [ ] Firewall configurado (só portas 80, 443, 22)
- [ ] Usuários criados com roles corretas
- [ ] .env revisado e sem secrets hardcoded

## 🟡 Testes (H-3 dias)

### Teste de Estresse (Domingo à Noite 🏆)
Para garantir que o sistema aguenta o pico do fim de semana:

```
1. Simular 1 venda a cada 5 segundos durante 1 hora
   → 720 vendas simuladas (12/min × 60min)
   → Verificar: estoque, fila de impressão, tempo de resposta

2. Desconectar o cabo de rede durante uma impressão
   → Verificar: worker tenta reconectar, comanda volta para PENDENTE
   → Verificar: após reconexão, comanda é impressa

3. Desligar o servidor no meio de uma transação
   → Verificar: ao religar, banco está consistente
   → Verificar: docker-compose up restaura tudo
   → Verificar: estoque continua íntegro (soma entradas - saídas = saldo)

4. Teste de Concorrência
   → 5 PDVs vendendo simultaneamente o mesmo produto
   → Verificar: nenhuma venda é perdida (deadlock)

5. Teste de Impressão
   → Imprimir 50 comandas consecutivas
   → Verificar: todas saem, nenhuma duplicada
```

### Critérios de Aceite
- [ ] Backup: `pg_dump` executado e arquivo íntegro (testar restore)
- [ ] Consistência: estoque após 1000 vendas simuladas
- [ ] Resiliência: recuperação após queda de energia
- [ ] Performance: API responde em < 500ms com 10 usuários simultâneos
- [ ] Impressão: fila processa 50 comandas em < 60 segundos

## 🔴 Dia do Go-Live (H-Hour)

### Manhã (antes da abertura)
- [ ] **08:00** — Verificar servidor ligado e containers rodando
  ```bash
  docker ps  # Todos os 4 containers devem estar UP
  ```
- [ ] **08:15** — Verificar conexão com o banco
  ```bash
  curl http://localhost/api/v1/admin/health/db
  ```
- [ ] **08:30** — Abrir caixa do dia
  ```bash
  POST /api/v1/caixa/abrir
  ```
- [ ] **08:45** — Testar impressão de comanda
  - Vender 1 produto de R$ 1,00
  - Verificar comanda impressa
  - Cancelar a venda (estorno)
- [ ] **09:00** — Iniciar expediente normal

### Durante o Funcionamento
- [ ] Monitorar logs:
  ```bash
  docker logs -f barize-backend --tail 50
  ```
- [ ] Verificar fila de impressão não acumula
- [ ] Verificar estoque após cada venda
- [ ] Em caso de erro, seguir Plano de Contingência

### Fechamento (após fechar o bar)
- [ ] Fechar caixa: conferir dinheiro vs sistema
- [ ] Verificar relatório de CMV do dia
- [ ] Executar backup manual:
  ```bash
  ./scripts/backup.sh
  ```
- [ ] Verificar se o backup foi bem-sucedido
- [ ] Anotar diferenças de caixa (se houver) em relatório

## 📋 Plano de Contingência

| Problema | Ação | Responsável |
|----------|------|-------------|
| Servidor desliga | 1. Aguardar 5 minutos 2. Religar servidor 3. `docker-compose up -d` 4. Verificar dados | Gerente |
| Impressora offline | 1. Verificar cabo/energia 2. Ping impressora 3. Se falhar: registrar em papel | Bartender |
| Bug no sistema | 1. Registrar no log 2. Usar caderno de reserva 3. Chamar suporte técnico | Gerente |
| Queda de energia | 1. UPS mantém ligado 2. Se > 10 min: desligar graciosamente 3. Aguardar energia retornar 4. Religar | Gerente |
| Erro no banco | 1. Parar serviços 2. Restaurar último backup 3. Verificar dados 4. Retomar operação | Suporte Técnico |

## 📊 Pós-Go-Live (H+7 dias)

### Checklist de Estabilização
- [ ] Primeira semana sem incidentes críticos
- [ ] Backup diário executando sem erros
- [ ] Equipe treinada em todos os módulos
- [ ] Usuários com roles corretas (sem permissão excessiva)
- [ ] Dados de estoque consistentes com inventário físico
- [ ] Relatórios CMV gerando dados coerentes
- [ ] Nenhum insumo com estoque negativo
- [ ] Webhooks de alerta (se configurados) funcionando

### Métricas de Sucesso
- **Disponibilidade**: > 99.5% (máximo 3h de downtime no mês)
- **CMV**: < 35% (custo dos insumos / receita total)
- **Perdas**: < 3% do estoque total
- **Satisfação**: Equipe usando o sistema sem resistência
