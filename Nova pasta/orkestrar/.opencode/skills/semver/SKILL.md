# semver

> **Categoria**: backend
> **Tags**: semver, versioning, breaking-changes, changelog, release

Semantic Versioning 2.0.0: MAJOR.MINOR.PATCH, pre-release tags, breaking changes, dependency resolution, changelog format (keepachangelog), e ferramentas de versionamento autom�tico (semantic-release, changesets).

## Quando Usar

Use ao versionar pacotes, planejar releases, analisar impacto de breaking changes, configurar versionamento autom�tico ou revisar depend�ncias.

## Regras de Versionamento

Formato: `MAJOR.MINOR.PATCH` (ex: `2.5.1`)

```
MAJOR: mudan�as incompat�veis com vers�es anteriores (breaking changes)
MINOR: novas funcionalidades compat�veis com vers�es anteriores
PATCH: corre��es de bugs compat�veis com vers�es anteriores
```

| Mudan�a                         | Tipo SEMVER | Exemplo  |
| ------------------------------- | ----------- | -------- |
| Remover fun��o p�blica          | MAJOR       | `v2.0.0` |
| Adicionar par�metro obrigat�rio | MAJOR       | `v2.0.0` |
| Mudar tipo de retorno           | MAJOR       | `v2.0.0` |
| Adicionar nova fun��o           | MINOR       | `v2.1.0` |
| Marcar fun��o como deprecated   | MINOR       | `v2.1.0` |
| Corrigir bug interno            | PATCH       | `v2.0.1` |
| Atualizar documenta��o          | PATCH       | `v2.0.1` |
| Adicionar testes                | PATCH       | `v2.0.1` |

## Pre-release & Build Metadata

**Pre-release** � vers�es experimentais, menos est�veis que a vers�o final:

```
1.0.0-alpha.1
1.0.0-alpha.2
1.0.0-beta.1
1.0.0-rc.1      ? Release Candidate
```

Ordem de preced�ncia: `1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-beta < 1.0.0-rc < 1.0.0`

**Build metadata** � informa��o adicional, ignorada na preced�ncia:

```
1.0.0+20260526  ? n�o muda ordem de vers�o
1.0.0+build.123
```

Regras:

- Pre-release vem AP�S o patch: `MAJOR.MINOR.PATCH-pre.id`
- Build metadata vem DEPOIS de `+`
- Pre-release tem menor preced�ncia que release normal

## Breaking Changes � Como Evitar

**Estrat�gias para minimizar MAJOR bumps**:

**Adi��o compat�vel**:

```typescript
// ? Breaking: mudou tipo de par�metro
function find(id: number): User;
// ? Compat�vel: overload ou uni�o
function find(id: number | string): User;

// ? Breaking: removeu par�metro
function create(name: string, age: number);
// ? Compat�vel: opcional com default
function create(name: string, age?: number);
```

**Depreca��o gradual**:

```typescript
/** @deprecated Use createUser() instead. Will be removed in v3.0.0 */
function addUser(data: UserData): User;
```

**Header de compatibilidade** em APIs HTTP:

```
Accept: application/vnd.api.v1+json   ? endpoints legados
Accept: application/vnd.api.v2+json   ? nova vers�o
```

**Compatibilidade retrospectiva**: manter wrapper que chama nova implementa��o

## Changelog � Keep a Changelog

Formato padronizado (keepachangelog.com):

```markdown
# Changelog

## [2.0.0] - 2026-06-15

### Added

- Endpoint `POST /users` com valida��o Zod
- Suporte a pagina��o cursor-based

### Changed

- `GET /users/:id` agora retorna `email` (antes omitia)
- Atualizado Node.js para v22 LTS

  BREAKING: `GET /users/:id` agora retorna `email` � clientes
  que dependiam da aus�ncia do campo precisam ser atualizados.

### Deprecated

- `POST /v1/register` ser� removido no v3 � use `POST /users`

### Removed

- Suporte a Node.js v18 (fim de vida)
- Campo `legacy_id` removido do response

### Fixed

- Valida��o de e-mail aceitava espa�os no in�cio

### Security

- Atualizada depend�ncia `lodash` para 4.17.21 (CVE-2024-XXXX)

## [1.1.0] - 2026-05-20

## [1.0.0] - 2026-05-01
```

**Tipos de mudan�a**: Added, Changed, Deprecated, Removed, Fixed, Security

## Automatiza��o � semantic-release / changesets

**semantic-release** (single package) � an�lise de commits ? release autom�tica:

```bash
npx semantic-release
```

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

Mapeamento Commit ? Version bump:

| Commit type       | Bump               | Exemplo                            |
| ----------------- | ------------------ | ---------------------------------- |
| `feat:`           | MINOR              | `feat: add user creation endpoint` |
| `fix:`            | PATCH              | `fix: correct email validation`    |
| `BREAKING CHANGE` | MAJOR              | `feat!: remove legacy v1 API`      |
| `perf:`           | PATCH              | `perf: optimize query`             |
| `docs:`           | PATCH (no release) | `docs: update readme`              |

**changesets** (monorepo) � m�ltiplos pacotes com versionamento independente:

```bash
npx changeset init
npx changeset add   # criar mudan�a para um pacote
npx changeset version  # aplicar vers�es
npx changeset publish  # publicar
```

## Dependency Resolution

**Range operators** no package.json:

| Operator | Exemplo   | Resolve          | Explica��o              |
| -------- | --------- | ---------------- | ----------------------- |
| `^`      | `^2.1.0`  | `>=2.1.0 <3.0.0` | Compat�vel com MAJOR    |
| `~`      | `~2.1.0`  | `>=2.1.0 <2.2.0` | Aproximado (PATCH only) |
| `>=`     | `>=2.0.0` | `>=2.0.0`        | M�nimo                  |
| `*`      | `*`       | Qualquer         | Tudo (evitar)           |
| `exact`  | `2.1.0`   | `2.1.0`          | Exato (lock)            |

**Lockfile** (`package-lock.json`) � garante instala��o determin�stica:

```bash
npm ci   # usa lockfile, mais r�pido e seguro
```

**Resolu��o de conflitos**:

- `npm update` ? atualiza dentro do range
- `npm outdated` ? lista depend�ncias desatualizadas
- `npx npm-check-updates` ? atualiza ranges no package.json
- Evitar `^*` no package.json (muito permissivo)
