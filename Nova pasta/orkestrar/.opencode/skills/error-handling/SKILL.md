# error-handling

> **Categoria**: patterns
> **Tags**: error-handling, erros, logging, apm, observability

Padrões de tratamento de erros: operacional vs programador, erros centralizados, logging, APM e graceful shutdown.

## Quando Usar

Use ao implementar ou revisar tratamento de erros em qualquer camada da aplicação.

## Tipos de Erro

**Operational Errors** (esperados, tratáveis):

- Request inválido (400), recurso não encontrado (404)
- Timeout de conexão, falha de serviço externo
- Ação: tratar e continuar, sem restart

**Programmer Errors** (inesperados, catastróficos):

- TypeError: Cannot read property of undefined
- Promise não tratada, null pointer
- Ação: logar, shutdown graceful, restart

## Central Error Handler

```typescript
// Handler centralizado (Express example)
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, reqId: req.id });

  if (isOperationalError(err)) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
  }

  // Programmer error — restart
  logger.fatal({ err }, 'Programmer error — restarting');
  process.exit(1);
}
```

## Logging Estruturado

- **Logger maduro**: Pino (performance) ou Winston (flexibilidade)
- **Formato JSON**: `{ "level": "error", "msg": "...", "err": {...}, "reqId": "..." }`
- **Log para stdout**: sem file destinations (infra cuida do roteamento)
- **Níveis**: fatal, error, warn, info, debug, trace
- **Contexto**: transactionId, userId, requestId em cada log

## Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(); // parar de aceitar requests
  await db.close(); // fechar conexões
  await queue.close(); // drenar mensagens
  process.exit(0);
});
```

## Anti-Patterns

- ❌ Catch silencioso (`catch {}` sem ação)
- ❌ Logar e relançar o mesmo erro
- ❌ Usar `console.error` em vez de logger
- ❌ Erros como strings (`throw 'deu ruim'`) em vez de `new Error()`
- ❌ Não tratar `unhandledRejection` e `uncaughtException`
