# async-patterns

> **Categoria**: patterns
> **Tags**: async, promises, streams, event-emitter, worker-threads

Padrões assíncronos: Promises, async/await, streams, Event Emitters, Worker Threads e concorrência.

## Quando Usar

Use ao lidar com operações assíncronas, I/O, processamento paralelo, streams de dados ou eventos.

## Async/Await

```typescript
// Sempre usar async/await sobre .then()/.catch()
async function process(id: string): Promise<Result> {
  try {
    const data = await fetchData(id);
    return transform(data);
  } catch (err) {
    logger.error({ err, id }, 'Failed to process');
    throw new ProcessingError('Failed', { cause: err });
  }
}
```

- `await` apenas quando necessário (paralelize com `Promise.all`)
- Nunca esquecer `await` — promessas soltas causam erros silenciosos

## Concorrência

```typescript
// Paralelo — todas de uma vez
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
])

// Sequencial — uma após a outra
for (const id of ids) {
  await process(id)
}

// Controlado — N por vez
async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> { ... }
```

## Streams

```typescript
// Leitura sob demanda (sem carregar tudo em memória)
const readStream = fs.createReadStream('large-file.csv', { encoding: 'utf-8' });
readStream.on('data', (chunk) => processChunk(chunk));
readStream.on('end', () => console.log('Done'));

// Pipeline com transformação
pipeline(
  fs.createReadStream('input.csv'),
  new CsvTransform(),
  fs.createWriteStream('output.ndjson'),
  (err) => (err ? console.error(err) : console.log('Done')),
);
```

## Worker Threads

- **CPU-bound**: Workers para processamento intensivo (criptografia, parsing)
- **Isolamento**: cada worker tem seu próprio V8 heap
- **Comunicação**: `parentPort.postMessage()` / `worker.on('message')`
- **Pool**: manter N workers para balancear carga

```typescript
const worker = new Worker('./cpu-heavy.js', { workerData: { input } });
worker.on('message', (result) => handleResult(result));
worker.on('error', (err) => handleError(err));
```

## Event Emitters

- Sempre tratar o evento `'error'` de EventEmitters (try/catch não captura)
- `emitter.on('error', handler)` — obrigatório
- Streams herdam EventEmitter — tratar `'error'`
- `once` vs `on`: usar `once` para eventos únicos
