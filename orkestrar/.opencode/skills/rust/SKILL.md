# rust

> **Categoria**: language
> **Tags**: rust, cargo, ownership, async, tokio, testing

Rust moderno: ownership, borrow checker, cargo, error handling (Result/Option/anyhow), traits, async/await (tokio), testing e boas práticas do ecossistema.

## Quando Usar

Use ao escrever código Rust, projetar sistemas de alto desempenho, lidar com concorrência segura ou revisar crates.

## Ownership & Borrowing

```rust
// Ownership: cada valor tem UM dono
let s1 = String::from("hello");
let s2 = s1; // s1 movido, NÃO compila mais usar s1

// Borrowing: referências sem tomar posse
fn calculate_len(s: &String) -> usize { s.len() }

// Mutable borrow (apenas um por vez)
fn append_world(s: &mut String) {
    s.push_str(" world");
}

// Lifetime annotations
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

- **Regras do borrow checker**: um mutável OU vários imutáveis, nunca ambos
- `&T` → leitura compartilhada, `&mut T` → escrita exclusiva
- Lifetime elisão: a maioria dos lifetimes é inferida

## Error Handling (Result/Option)

```rust
// Result para erros recuperáveis
fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.parse::<i32>()
}

// ? operator — propagação automática
fn process_file(path: &str) -> Result<String, io::Error> {
    let content = std::fs::read_to_string(path)?;
    Ok(content.to_uppercase())
}

// anyhow para aplicações (erros dinâmicos)
use anyhow::{Result, Context};
fn read_config() -> Result<Config> {
    let data = std::fs::read_to_string("config.toml")
        .context("failed to read config file")?;
    let config: Config = toml::from_str(&data)?;
    Ok(config)
}

// thiserror para bibliotecas (erros estruturados)
#[derive(thiserror::Error, Debug)]
pub enum AppError {
    #[error("user {0} not found")]
    NotFound(String),
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
}
```

## Traits & Generics

```rust
// Trait definition
trait Drawable {
    fn draw(&self) -> String;
}

// Implementação para qualquer tipo que implemente Display
impl<T: std::fmt::Display> Drawable for T {
    fn draw(&self) -> String {
        format!("Drawable: {}", self)
    }
}

// Generics com trait bounds
fn print_drawable(items: &[impl Drawable]) {
    for item in items {
        println!("{}", item.draw());
    }
}

// Associated types
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

- **Traits sem implementação default**: métodos obrigatórios
- **Derive macros**: `#[derive(Debug, Clone, PartialEq)]`
- **Sized vs ?Sized**: tipos com tamanho conhecido em compile-time
- **Coherence rule**: pelo menos um tipo na impl deve ser local ao crate

## Async (tokio)

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() -> Result<()> {
    // Concorrência controlada
    let handles: Vec<_> = (0..10)
        .map(|i| tokio::spawn(async move {
            process_item(i).await
        }))
        .collect();

    for handle in handles {
        handle.await??;
    }
    Ok(())
}

// Stream processing (futures::StreamExt)
use futures::StreamExt;
let mut stream = tokio_stream::iter(1..=100);
while let Some(item) = stream.next().await {
    process(item).await;
}
```

- **tokio**: runtime async mais usado (multi-threaded por default)
- **async-std**: alternativa minimalista
- **Avoid `async` in hot loops**: overhead de runtime
- **Select! macro**: `tokio::select!` para múltiplos canais/timeouts

## Testing (cargo test)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_error_case() {
        let result = divide(10, 0);
        assert!(result.is_err());
    }

    // Property-based testing com proptest
    use proptest::prelude::*;
    proptest! {
        #[test]
        fn double_should_be_even(x: i32) {
            let result = double(x);
            assert_eq!(result % 2, 0);
        }
    }
}
```

- `cargo test` — execução paralela por default
- `#[should_panic]` para testes que devem panicar
- `cargo tarpaulin` para cobertura de código
- `cargo bench` para benchmarks (nightly ou `criterion`)

## Tooling (cargo, clippy, rustfmt)

```toml
# .cargo/config.toml
[target.x86_64-unknown-linux-gnu]
rustflags = ["-C", "target-cpu=native"]

# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
```

- **cargo clippy**: linter com sugestões de melhoria (executar sempre)
- **cargo fmt**: formatação padronizada (obrigatório em CI)
- **cargo audit**: vulnerabilidades em dependências
- **cargo deny**: checagem de licenças e sources
- **cargo outdated**: dependências desatualizadas
- `rustup`: gerenciador de toolchains (stable, nightly)
