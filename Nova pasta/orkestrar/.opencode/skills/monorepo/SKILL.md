# monorepo

> **Categoria**: backend
> **Tags**: monorepo, turborepo, nx, workspaces, pnpm, ci-cd

Monorepo management: workspaces (npm/yarn/pnpm), turborepo/nx, dependency management (shared vs isolated), atomic commits, CI/CD for monorepos, change detection (affected projects).

## Quando Usar

Use ao configurar ou gerenciar monorepos, organizar workspaces, configurar build caching, otimizar CI/CD com change detection, ou gerenciar depend�ncias compartilhadas.

## Workspace Configuration

**npm workspaces**:

```json
{
  "workspaces": ["packages/*", "apps/*"]
}
```

**yarn workspaces**:

```json
{
  "workspaces": ["packages/*", "apps/*"],
  "nohoist": ["**/some-package"]
}
```

**pnpm workspaces** (recomendado):

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'
```

**Estrutura de monorepo**:

```
my-monorepo/
+-- apps/
�   +-- web/            ? Next.js app
�   +-- api/            ? Express API
�   +-- mobile/         ? React Native app
+-- packages/
�   +-- ui/             ? Componentes compartilhados
�   +-- config/         ? ESLint, tsconfig compartilhados
�   +-- utils/          ? Fun��es utilit�rias
+-- package.json        ? Root (workspaces config)
+-- pnpm-lock.yaml
```

## Build Orchestration (turborepo/nx)

**turbo.json** (Turborepo):

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "test/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**nx.json** (Nx):

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": ["build", "test", "lint"],
        "accessToken": "�"
      }
    }
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"]
    }
  }
}
```

**Comandos**:

```bash
npx turbo build         # build all (em ordem de depend�ncia)
npx turbo test --filter=@repo/web  # test apenas web
npx nx affected:test    # Nx: test only affected by changes
npx turbo run lint test  # m�ltiplos targets
```

## Dependency Management

**Depend�ncias compartilhadas** (root `package.json`):

```json
{
  "devDependencies": {
    "typescript": "^5.5",
    "eslint": "^9.0",
    "vitest": "^2.0"
  }
}
```

**Hoisting vs isolation**:
| Estrat�gia | Pr�s | Contras |
|------------|------|---------|
| **Hoisting** (npm/yarn) | Menos duplica��o, disco menor | Conflitos de vers�o |
| **Isolated** (pnpm) | Isolamento total, sem conflitos | Mais links, disco maior |
| **Sharp** (pnpm) | Hoisting inteligente | Configura��o adicional |

**Regras**:

- Ferramentas de dev (ESLint, TypeScript, Vitest) no root
- Depend�ncias de bibliotecas em cada package
- `pnpm up --recursive` para atualizar depend�ncias em massa
- `pnpm -r exec npm audit` para auditoria em todo workspace

## CI/CD Strategies

**CI otimizado com change detection**:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: '22' }

      - run: pnpm install
      - run: pnpm build

      # Test only affected packages (Turborepo)
      - run: npx turbo test --filter=[origin/main]

      # Lint all
      - run: npx turbo lint
```

**Pipeline matrix**:

```yaml
strategy:
  matrix:
    package: [web, api, mobile, ui, utils]
  # Parallel matrix build
  fail-fast: false
steps:
  - run: npx turbo test --filter=@repo/${{ matrix.package }}
```

**Cache de build**:

- Turborepo: cache local (`.turbo/`) + remoto (Vercel)
- Nx: cache local + Nx Cloud
- pnpm: `store` cache para depend�ncias

## Atomic Changes & Commits

**Commits at�micos em monorepo**:

```bash
feat(web): add user profile page
fix(api): correct pagination offset
chore(deps): upgrade typescript to 5.5
refactor(utils): extract validation helpers
```

**Changesets** (versionamento):

```bash
pnpm changeset          # criar changeset
pnpm changeset version  # aplicar vers�es
pnpm changeset publish  # publicar
```

**Boas pr�ticas**:

- Um commit pode alterar m�ltiplos packages (se relacionados)
- Mensagens com escopo: `tipo(escopo): mensagem`
- Changesets por package afetado
- PRs revisados por package (code owners)
- `CODEOWNERS` para reviewers autom�ticos:

```
/apps/web/ @web-team
/packages/ui/ @ui-team
```

## Change Detection (Affected Projects)

**Turborepo**: `--filter=[target-branch]`

```bash
# Test only packages affected by changes since main
npx turbo test --filter="...[origin/main]"

# Build from specific package upward
npx turbo build --filter="...[HEAD^1]"
```

**Nx**: `nx affected`

```bash
# Show affected apps
npx nx affected:apps --base=origin/main

# Test affected
npx nx affected:test --base=origin/main

# Graph of affected
npx nx graph --affected
```

**pnpm + `--filter`**:

```bash
# Packages changed since main
pnpm list --filter="...[origin/main]" --depth=-1

# Test all dependents of changed packages
pnpm test --filter="...[origin/main]"
```

**Estrat�gia de CI**:

```
1. git fetch origin main
2. Detectar altera��es: `git diff --name-only origin/main HEAD`
3. Mapear arquivos ? packages afetados
4. Executar testes apenas nos pacotes afetados + dependentes
5. Cache de resultados (Turborepo/Nx)
```
