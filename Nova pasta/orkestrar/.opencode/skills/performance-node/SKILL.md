# performance-node

> **Categoria**: backend
> **Tags**: performance, profiling, nodejs, memory, benchmark, event-loop

Performance em Node.js: profiling, event loop, memory, CPU-bound, benchmarks e otimizações.

## Quando Usar

Use ao diagnosticar lentidão, otimizar código, fazer profiling ou validar performance com benchmarks.

## O Event Loop

O coração do Node.js: uma thread, loop infinito, fases:

```
timers → pending callbacks → idle/prepare → poll → check → close callbacks
```

- **NUNCA bloquear o event loop**: operações CPU-bound em Worker Threads
- **Timers**: `setTimeout`, `setInterval` — fase timers
- **I/O**: callbacks de I/O — fase poll
- **setImmediate**: fase check (depois do poll)
- **process.nextTick**: entre cada fase (usar com moderação)

## Profiling

**Ferramentas**:

- `node --prof` + `node --prof-process` — flame graphs básicos
- `clinic.js` (Doctor, Bubbleprof, Flame) — análise visual
- `0x` — flame graphs interativos
- Chrome DevTools — `node --inspect` + chrome://inspect
- `perf` + `flamegraph` (Linux) — system-level profiling

**Fluxo de diagnóstico**:

1. Clinic Doctor: visão geral de problemas
2. Clinic Flame: onde o tempo está sendo gasto
3. Clinic Bubbleprof: latência entre operações
4. DevTools Heap Snapshot: memory leaks

## Gerenciamento de Memória

- **Memory leak patterns**:
  - Global variables que acumulam
  - Closures que retêm referências
  - Event listeners não removidos (`.on` sem `.off`)
  - Timers não limpos (`setInterval` sem `clearInterval`)
  - Caches sem limite (LRU cache recommended)
- **Heap snapshots**: comparar antes/depois para detectar leaks
- **GC**: `--expose-gc` + `global.gc()` para debug
- **Limites**: `NODE_OPTIONS="--max-old-space-size=512"`

## Otimizações Práticas

- **I/O-bound**: async/await + Promise.all
- **CPU-bound**: Worker Threads ou child_process
- **JSON parsing**: `JSON.parse` é surpreendentemente rápido
- **Loops**: preferir `for` clássico sobre `forEach`/`map` para hot paths
- **Object pooling**: reutilizar objetos em vez de criar novos
- **Buffer pooling**: reutilizar buffers para I/O de rede
- **Streams**: para dados grandes, nunca carregar tudo em memória

## Benchmarking

```typescript
import { Bench } from 'tinybench';
const bench = new Bench();
bench.add('JSON.parse', () => JSON.parse('{"a":1}'));
bench.add('JSON.stringify', () => JSON.stringify({ a: 1 }));
await bench.run();
console.table(bench.table());
```

- Sempre rodar benchmarks múltiplas vezes
- Isolar o que está sendo medido
- Cuidado com JIT warm-up (rodar antes de medir)
- Comparar com baseline (versão anterior)
