# kafka

> **Categoria**: devops
> **Tags**: kafka, streaming, event-streaming, schema-registry, kafka-streams, connect

Apache Kafka: topics, partitions, consumer groups, exactly-once semantics, schema registry (Avro/Protobuf), Kafka Connect, Kafka Streams, KRaft, performance tuning, monitoring.

## Quando Usar

Use ao projetar sistemas de streaming, configurar producers/ consumers, gerenciar schemas com Schema Registry, configurar Kafka Connect, ou otimizar performance Kafka.

## Core Concepts

**Topics & Partitions**:

```
Topic "orders"
+-- Partition 0 (Leader: broker-1, Replicas: 2, 3)
+-- Partition 1 (Leader: broker-2, Replicas: 1, 3)
+-- Partition 2 (Leader: broker-3, Replicas: 1, 2)
```

- **Partition**: unidade de paralelismo e ordena��o
- **Offset**: posi��o da mensagem na parti��o (sequencial)
- **Retention**: tempo (default 7 dias) ou tamanho m�ximo
- **Replication factor**: N c�pias (3 recomendado produ��o)
- **ISR** (In-Sync Replicas): r�plicas atualizadas

**Produ��o**:

```typescript
const producer = kafka.producer();
await producer.send({
  topic: 'orders',
  messages: [{ key: 'order-123', value: JSON.stringify(order) }],
});
```

**Consumo** (consumer group):

```typescript
const consumer = kafka.consumer({ groupId: 'order-processor' });
await consumer.subscribe({ topic: 'orders', fromBeginning: false });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const order = JSON.parse(message.value!.toString());
    await processOrder(order);
  },
});
```

## Consumers & Consumer Groups

**Consumer Group**: N consumers dividem N parti��es

```
grupo: order-processor
+-- Consumer-1 ? Partition 0, Partition 1
+-- Consumer-2 ? Partition 2, Partition 3
+-- Consumer-3 ? Partition 4
```

**Regras**:

- M�ximo de consumers = n�mero de parti��es (excedentes ficam idle)
- Rebalanceamento quando consumer entra/sai
- **Sticky assignor**: minimiza rebalanceamento (recomendado)

**Commit strategies**:

```typescript
// At-least-once (padr�o): commit ap�s processar
await consumer.run({
  eachMessage: async ({ message }) => {
    await process(message)  // processa primeiro
    await consumer.commitOffsets(...)  // depois commita
  },
})

// Exactly-once: transactional producer + consumer
// (idempotent producer + isolation.level=read_committed)
```

**Pausar/retomar** para backpressure:

```typescript
consumer.pause([{ topic: 'orders' }]);
// processar lote...
consumer.resume([{ topic: 'orders' }]);
```

## Schema Registry

**Avro schema** (recomendado para Kafka):

```avro
{
  "type": "record",
  "name": "OrderPlaced",
  "namespace": "com.example.events",
  "fields": [
    {"name": "orderId", "type": "string"},
    {"name": "customerId", "type": "string"},
    {"name": "total",     "type": "double"},
    {"name": "items",     "type": {"type": "array", "items": "OrderItem"}},
    {"name": "eventTime", "type": "long", "logicalType": "timestamp-millis"}
  ]
}
```

**Producer com Schema Registry**:

```typescript
const { AvroSerializer } = require('@kafkajs/confluent-schema-registry');

const registry = new SchemaRegistry({ host: 'http://schema-registry:8081' });
const serializer = new AvroSerializer(registry, {
  schemaId: await registry.register({ type: 'AVRO', schema: orderSchema }),
});

await producer.send({
  topic: 'orders',
  messages: [{ value: await serializer.serialize(order) }],
});
```

**Compatibilidade de schemas**:
| Estrat�gia | Regra | Uso |
|------------|-------|-----|
| **BACKWARD** | Novo schema l� dados antigos | Default, seguro |
| **FORWARD** | Schema antigo l� dados novos | Evolu��o flex�vel |
| **FULL** | Ambos os sentidos | M�xima compatibilidade |
| **NONE** | Sem verifica��o | Apenas dev |

**Protobuf** tamb�m suportado no Schema Registry

## Kafka Streams DSL

**Kafka Streams DSL** � API nativa para processamento de streams:

```typescript
import { KafkaStreams } from 'kafka-streams';

const builder = new KafkaStreams();

// KStream: stream de registros
const orders = builder.stream<string, Order>('orders', {
  keyDeserializer: 'string',
  valueDeserializer: 'avro',
});

// Opera��es de transforma��o
const highValueOrders = orders
  .filter(({ value }) => value.total > 1000)
  .map(({ key, value }) => ({
    key,
    value: { ...value, priority: 'high' },
  }));

// KTable: tabela materializada (chave-valor)
const totalsByCustomer = orders
  .groupBy(({ value }) => value.customerId)
  .aggregate(
    () => ({ count: 0, total: 0 }),
    (agg, { value }) => ({
      count: agg.count + 1,
      total: agg.total + value.total,
    }),
  );

// Output para t�pico
highValueOrders.to('high-value-orders');
```

**Operadores principais**:

| Operador     | Tipo      | Descri��o                                  |
| ------------ | --------- | ------------------------------------------ |
| `filter`     | Stateless | Seleciona registros por predicate          |
| `map`        | Stateless | Transforma cada registro                   |
| `flatMap`    | Stateless | 1 registro ? N registros                   |
| `groupBy`    | Stateful  | Reparticiona por nova chave                |
| `aggregate`  | Stateful  | Agrega��o com estado                       |
| `join`       | Stateful  | Join entre KStream/KTable                  |
| `windowedBy` | Stateful  | Janela temporal (hopping/tumbling/session) |

**KSQL** (SQL para streams):

```sql
CREATE STREAM orders (
  orderId VARCHAR KEY,
  customerId VARCHAR,
  total DOUBLE
) WITH (
  KAFKA_TOPIC = 'orders',
  VALUE_FORMAT = 'AVRO'
);

CREATE TABLE total_per_customer AS
  SELECT customerId, SUM(total) AS totalSpent
  FROM orders
  WINDOW TUMBLING (SIZE 1 HOUR)
  GROUP BY customerId
  EMIT CHANGES;
```

## State Stores

**Tipos de State Store** no Kafka Streams:

| Store             | Persist�ncia     | Uso                            |
| ----------------- | ---------------- | ------------------------------ |
| **InMemoryStore** | Vol�til          | Testes, cache local            |
| **RocksDBStore**  | Disco (LSM-tree) | Padr�o produ��o, dados grandes |
| **TimedStore**    | Disco + janela   | Windowed aggregations          |

**Configura��o**:

```typescript
import { RocksDBConfig } from 'kafka-streams';

const store = builder.store('my-state', {
  storeType: 'rocksdb',
  config: new RocksDBConfig({
    cacheSize: 100 * 1024 * 1024, // 100 MB
    writeBufferSize: 64 * 1024 * 1024, // 64 MB
    blockSize: 4096,
  }),
});
```

**Fault tolerance**:

- State stores s�o **log-compacted topics** no Kafka interno (`changelog`)
- Em caso de falha, a store � reconstru�da pelo changelog
- `commit.interval.ms`: frequ�ncia de checkpoint (default 16s)
- `cache.max.bytes.buffering`: cache para reduzir writes no changelog

**Boas pr�ticas**:

- Sempre usar RocksDB em produ��o (n�o InMemory)
- Monitorar size do state dir (`state.dir`)
- Usar `standby replicas` para failover r�pido
- Partitioning: n�mero de parti��es = throughput desejado

## Exactly-Once Semantics (EOS)

**EOS** garante que mensagens sejam processadas exatamente uma vez, sem duplicatas nem perdas.

**Componentes**:

```
Produtor(idempotent)
+-- enable.idempotence=true (idempot�ncia na produ��o)
+-- max.in.flight.requests.per.connection=5 (com retries)
+-- acks=all (espera todos os ISRs)

Consumidor(transactions)
+-- isolation.level=read_committed
+-- Consome apenas mensagens committed

Broker
+-- transaction.state.log.replication.factor=3
+-- transaction.state.log.min.isr=2
```

**Transactional producer** (exatamente-uma na produ��o):

```typescript
const producer = kafka.producer({
  transactionalId: 'order-producer-1', // �nico por inst�ncia
  maxInFlightRequests: 5,
  idempotent: true,
});

await producer.connect();
await producer.initTransactions();

try {
  await producer.beginTransaction();
  await producer.send({
    topic: 'orders',
    messages: [{ key: 'order-1', value: '...' }],
  });
  await producer.sendOffsets({
    groupId: 'order-processor',
    topics: {
      orders: [{ partition: 0, offset: '42' }],
    },
  });
  await producer.commitTransaction();
} catch (err) {
  await producer.abortTransaction();
}
```

**Configura��es cr�ticas**:

- `transactional.id`: deve ser �nico por inst�ncia produtora
- `transaction.timeout.ms`: timeout da transa��o (default 60s)
- `max.in.flight.requests.per.connection`: com idempotente, pode ser > 1
- `request.timeout.ms`: deve ser > transaction.timeout.ms

**Limita��es**:

- Apenas 1 transa��o ativa por producer
- N�o funciona entre clusters (sem mirroring transacional)
- Overhead de performance (~15% no throughput)

## KRaft Mode (Kafka sem ZooKeeper)

**KRaft** (Kafka Raft) elimina a depend�ncia do ZooKeeper usando o protocolo Raft para consenso.

**Arquitetura**:

```
+----------------------------------+
�       KRaft Cluster              �
�  +------+  +------+  +------+   �
�  �Controller�  �Controller�  �Controller�   �
�  �  (Leader) �  �(Follower)�  �(Follower)�   �
�  +------+  +------+  +------+   �
�         �           �           �           �
�  +------+  +------+  +------+   �
�  �Broker 1�  �Broker 2�  �Broker 3�   �
�  +------+  +------+  +------+   �
+----------------------------------+
```

**Configura��o** (`server.properties`):

```properties
# KRaft mode
process.roles=broker,controller
node.id=1
controller.quorum.voters=1@kafka1:9093,2@kafka2:9093,3@kafka3:9093

# Metadata log
metadata.log.dir=/var/lib/kafka/metadata
controller.listener.names=CONTROLLER
listeners=PLAINTEXT://:9092,CONTROLLER://:9093
```

**Migra��o de ZooKeeper para KRaft**:

```bash
# 1. Gerar ID do cluster
kafka-storage.sh random-uuid
# UUID gerado: xyz123

# 2. Formatar o storage com o metadata
kafka-storage.sh format -t xyz123 -c server.properties

# 3. Iniciar Kafka (j� em KRaft mode)
kafka-server-start.sh server.properties
```

**Vantagens**:

- **Simplicidade**: 1 sistema (Kafka) em vez de 2 (Kafka + ZK)
- **Escalabilidade**: at� 3x mais parti��es (milh�es)
- **Performance**: metadata operations 10-50x mais r�pidas
- **Seguran�a**: TLS entre controllers nativo

**Considera��es**:

- M�nimo 3 controllers (recomendado 3 ou 5)
- `controller.quorum.election.timeout.ms=1500` (padr�o)
- KRaft � produ��o desde Kafka 3.5 (recomendado 3.7+)

## Performance Tuning

**Producer tuning**:

```properties
# Throughput m�ximo
batch.size=131072           # 128 KB (padr�o 16 KB)
linger.ms=50                # Espera 50ms por lote
compression.type=snappy     # Compress�o (snappy=lento; zstd=melhor ratio)
buffer.memory=134217728     # 128 MB buffer de envio
max.request.size=1048576    # 1 MB (se mensagens grandes, aumentar)

# Lat�ncia baixa
# batch.size=16384           # 16 KB (lotes pequenos)
# linger.ms=0                # Envio imediato
# acks=1                     # Apenas leader confirma
```

**Consumer tuning**:

```properties
# Throughput
fetch.min.bytes=524288        # 512 KB m�nimo por fetch
fetch.max.wait.ms=500         # M�ximo 500ms de espera
max.partition.fetch.bytes=1048576  # 1 MB por parti��o

# Processamento em lote
enable.auto.commit=false
max.poll.records=500          # Registros por poll
max.poll.interval.ms=300000   # 5 min timeout de processamento
```

**Broker tuning**:

```properties
# Disco e rede
num.network.threads=8         # Network threads (default 3)
num.io.threads=16             # I/O threads (default 8)
num.replica.fetchers=4        # Fetchers de replica��o
log.segment.bytes=1073741824  # 1 GB por segmento
log.retention.bytes=-1        # Sem limite por tamanho
log.retention.hours=168       # 7 dias reten��o

# Pagina��o
log.flush.interval.messages=10000
log.flush.interval.ms=1000
```

**Regras pr�ticas**:
| Cen�rio | Foco | Ajuste |
|---------|------|--------|
| Alta throughput (>100MB/s) | Producer batch, compress�o | batch.size > 128KB, zstd |
| Baixa lat�ncia (<50ms p99) | Consumer tuning, parti��es | Parti��es = consumers \* 3 |
| Mensagens grandes (>1MB) | max.request.size, segment size | max.message.bytes=10MB |
| Alta durabilidade | Replication factor, min.insync.replicas | RF=3, min.isr=2 |

**Capacity planning**:

```
Throughput produtor:  100 MB/s
Replica��o (3x):      +200 MB/s (network overhead)
Total cluster:        300 MB/s
Discos:               3x NVMe 1TB (estripados)
RAM:                  32 GB por broker (heap 8-12 GB)
CPU:                  16 cores (8 para I/O, 8 para processing)
```

## Monitoring & Observability

**M�tricas essenciais** (JMX MBeans):

```prometheus
# Broker
kafka_server_BrokerTopicMetrics_BytesInPerSec{rate=mean}
kafka_server_BrokerTopicMetrics_BytesOutPerSec{rate=mean}
kafka_server_BrokerTopicMetrics_MessagesInPerSec{rate=mean}

# Partitions
kafka_server_ReplicaManager_UnderReplicatedPartitions{count}
kafka_server_ReplicaManager_UnderMinIsrPartitionCount{count}
kafka_controller_ControllerStats_LeaderElectionRateAndTimeMs{rate=mean}

# Consumers
kafka_consumer_ConsumerGroupMetrics_OffsetLag{consumer_group}
kafka_consumer_ConsumerGroupMetrics_OffsetLagMax{consumer_group}

# Requests
kafka_network_RequestMetrics_TotalTimeMs{p99}
```

**Kafka Exporter** (Prometheus):

```yaml
# docker-compose.yml
services:
  kafka-exporter:
    image: danielqsj/kafka-exporter:latest
    command:
      - --kafka.server=kafka:9092
      - --web.listen-address=:9308
    ports:
      - '9308:9308'
```

**Dashboards recomendados**:

- [Kafka Dashboard (JMX)](https://grafana.com/grafana/dashboards/14563) � Grafana
- [Kafka Exporter Dashboard](https://grafana.com/grafana/dashboards/7589) � comunidade
- Confluent Control Center (comercial)

**Cruise Control** � rebalanceamento autom�tico:

```bash
docker run -d \
  -e BOOTSTRAP_SERVERS=kafka:9092 \
  -e KAFKA_CRUISE_CONTROL_BOOTSTRAP_SERVERS=kafka:9092 \
  -p 9090:9090 \
  confluentinc/cp-kafka-cruise-control:latest
```

**Alertas cr�ticos** (PagerDuty/Alertmanager):
| Alerta | Threshold | A��o |
|--------|-----------|------|
| UnderReplicatedPartitions > 0 | Imediato | Verificar brokers down |
| OfflinePartitions > 0 | Imediato | Restart brokers |
| RequestHandlerAvgIdlePercent < 20% | Cr�tico | Aumentar threads |
| NetworkProcessorAvgIdlePercent < 30% | Cr�tico | Aumentar network threads |
| Lag > 10000 por parti��o | Warning | Adicionar consumers |
| DiskUsage > 85% | Warning | Estender disco ou limpar
