# Node.js

> **Categoria**: backend
> **Tags**: node, runtime, javascript, servidor

Node.js é um runtime JavaScript assíncrono orientado a eventos, projetado para construir aplicações escaláveis de rede.

## Quando Usar

Use ao construir APIs REST, ferramentas CLI, ou scripts de automação no backend.

## Módulos Core

- `fs` — sistema de arquivos (leitura/escrita)
- `path` — manipulação de caminhos
- `crypto` — hash e criptografia
- `stream` — processamento de dados em chunks

## Boas Práticas

- Preferir versões import (`import`) sobre require
- Usar `node:fs` em vez de `fs` para clareza de módulo core
- Tratar erros com try/catch em operações async
