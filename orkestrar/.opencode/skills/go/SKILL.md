# go

> **Categoria**: language
> **Tags**: go, golang, goroutines, testing, modules, concurrency

Go moderno (1.22+): tooling, goroutines, error handling idiomático, interfaces, testing table-driven, modules e boas práticas.

## Quando Usar

Use ao escrever código Go, projetar APIs REST em Go, lidar com concorrência ou revisar pacotes Go existentes.

## Tooling & Layout

- **gofmt**: formatação obrigatória (`gofmt -s` para simplificação)
- **golangci-lint**: linter agregado (vet, staticcheck, errcheck)
- **go vet**: análise estática embutida
- Estrutura de projeto padrão:

```
my-project/
├── cmd/           ← entry points (main packages)
│   └── server/main.go
├── internal/      ← código não exportado (private)
│   ├── handler/
│   └── service/
├── pkg/           ← código exportado (reutilizável)
└── go.mod
```

## Concurrency (goroutines & channels)

```go
// Fan-out pattern
results := make(chan Result, len(jobs))
var wg sync.WaitGroup

for _, job := range jobs {
    wg.Add(1)
    go func(j Job) {
        defer wg.Done()
        results <- process(j)
    }(job)
}

go func() {
    wg.Wait()
    close(results)
}()

for res := range results {
    // consume results
}

// Select with timeout
select {
case msg := <-ch:
    handle(msg)
case <-time.After(5 * time.Second):
    log.Println("timeout")
}
```

- **Share memory by communicating** (não comunicar compartilhando memória)
- `sync.Mutex` para estado compartilhado simples
- `sync.Map` para caches concorrentes (apenas casos específicos)
- `context.Context` como primeiro parâmetro em funções blocking

## Error Handling Idiomático

```go
// Sempre verificar erros — não existem exceções
f, err := os.Open(filename)
if err != nil {
    return fmt.Errorf("opening %s: %w", filename, err)
}
defer f.Close()

// Sentinel errors vs custom types
var ErrNotFound = errors.New("not found")

// Wrapping com %w para errors.Is/errors.As
if errors.Is(err, ErrNotFound) {
    // handle not found
}
```

- **Nunca ignorar erros**: `_ = doSomething()` é aceitável apenas em defers
- **Error wrapping**: `fmt.Errorf("context: %w", err)` preserva a cadeia
- **Panic apenas para programmer errors**: inicialização, erros irrecuperáveis
- `defer` para cleanup (close, unlock) imediatamente após aquisição

## Interfaces & Composition

```go
// Interfaces pequenas (1-3 métodos) — copiar/colar é idiomático
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }

// Composição de interfaces
type ReadWriter interface {
    Reader
    Writer
}

// Satisfação implícita (duck typing) — não precisa de "implements"
type FileStore struct { /* ... */ }
func (f *FileStore) Read(p []byte) (int, error) { /* ... */ }
// FileStore implementa Reader automaticamente
```

- **Accept interfaces, return structs**
- **Interface segregação**: interfaces pequenas e coesas
- **Embedding**: composição via struct embedding (não herança)

## Testing (table-driven)

```go
func TestDivide(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
        err      bool
    }{
        {name: "positive", a: 10, b: 2, expected: 5, err: false},
        {name: "by zero",  a: 10, b: 0, expected: 0, err: true},
        {name: "negative", a: -6, b: 3, expected: -2, err: false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := Divide(tt.a, tt.b)
            if tt.err && err == nil {
                t.Error("expected error")
            }
            if result != tt.expected {
                t.Errorf("got %d, want %d", result, tt.expected)
            }
        })
    }
}
```

- **Testify**: `assert.Equal(t, expected, actual)` para asserções legíveis
- **Testcontainers**: para testes de integração com banco/Redis
- `go test -race` para detectar race conditions
- `go test -coverprofile=coverage.out` para cobertura
- `testing/slog` para capturar logs em testes

## Modules & Packages

```
go mod init github.com/user/project
go get github.com/lib/pq@v1.10.9
go mod tidy    # limpa dependências não usadas
go mod vendor  # vendor para CI offline
```

- **Módulo único por repositório** (monorepo com múltiplos módulos possível, mas complexo)
- **Versionamento semântico**: tags `v1.2.3` no git
- **Internal packages**: `internal/` não é importável por módulos externos
- **Cuidado com `init()` functions**: side effects implícitos, preferir lazy init
