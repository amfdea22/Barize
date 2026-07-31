# security-supply-chain

> **Categoria**: security
> **Tags**: supply-chain, slsa, sbom, sigstore, cosign, dependabot, snyk

Seguran�a de supply chain: SLSA framework, SBOM (CycloneDX/SPDX), Sigstore/cosign para signing, escaneamento de depend�ncias (Dependabot/Snyk/Renovate), npm audit e attestation de software.

## Quando Usar

Use ao configurar seguran�a de pipeline CI/CD, gerar SBOM para conformidade, assinar artefatos de build ou auditar depend�ncias de terceiros.

## SLSA Framework � N�veis

**SLSA** (Supply-chain Levels for Software Artifacts) � framework de seguran�a:

| N�vel      | Requisitos                                | Benef�cio                |
| ---------- | ----------------------------------------- | ------------------------ |
| **SLSA 1** | Build documentado (script/CI)             | Rastreabilidade b�sica   |
| **SLSA 2** | Build isolado (host ef�mero) + assinatura | Integridade do artefato  |
| **SLSA 3** | Build herm�ticos + sem acesso a secrets   | Preven��o de adultera��o |
| **SLSA 4** | Build reproduz�vel + auditoria completa   | Garantia m�xima          |

**Meta pr�tica**: atingir SLSA 2+ para projetos p�blicos, SLSA 3+ para cr�ticos.

```yaml
# GitHub Actions com build isolado (SLSA 3)
jobs:
  build:
    runs-on: ubuntu-latest # ef�mero
    permissions:
      id-token: write # para Sigstore
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: slsa-framework/slsa-github-generator@v2
        with:
          artifacts: 'dist/*.tgz'
```

## SBOM � Generation (CycloneDX / SPDX)

**SBOM** (Software Bill of Materials) � invent�rio de componentes:

```bash
# CycloneDX (formato moderno, mais rico)
npx @cyclonedx/cyclonedx-npm --output-format JSON --output-file bom.cyclonedx.json

# SPDX (formato ISO 5962)
npx @cyclonedx/cyclonedx-npm --output-format SPDX --output-file bom.spdx.json

# Syft (para sistemas, n�o apenas npm)
syft packages . -o cyclonedx-json > bom.syft.json
```

**O que incluir**:

- Todas as depend�ncias diretas e transitivas
- Vers�o, licen�a, resolved URL, hash (SHA-256/512)
- Metadados do pacote (autor, home page)

**Onde armazenar**:

- Junto ao artefato de release
- Publicar em reposit�rio central (Dependency-Track, S3)
- Versionar no reposit�rio (bom.json versionado)

## Signing � Sigstore / cosign

Assinar artefatos garante integridade e autenticidade:

```bash
# Instalar cosign
brew install cosign  # ou baixar de sigstore/cosign

# Assinar container image
cosign sign --key cosign.key ghcr.io/org/app:1.0.0

# Assinar com identidade OIDC (GitHub Actions)
cosign sign --yes ghcr.io/org/app:1.0.0

# Assinar arquivo (npm tarball)
cosign sign-blob --key cosign.key dist/app-1.0.0.tgz > dist/app-1.0.0.tgz.sig

# Verificar
cosign verify --key cosign.pub ghcr.io/org/app:1.0.0
cosign verify-blob --key cosign.pub --signature dist/app-1.0.0.tgz.sig dist/app-1.0.0.tgz
```

**Keyless (recomendado)** � Sigstore usa identidade OIDC, sem gerenciar chaves:

```bash
cosign sign --yes ghcr.io/org/app:1.0.0  # usa GitHub OIDC
cosign verify ghcr.io/org/app:1.0.0 \
  --certificate-identity-regexp 'https://github.com/org/*'
```

## Dependency Scanning

| Ferramenta     | Tipo                     | Integra��o                     |
| -------------- | ------------------------ | ------------------------------ |
| **Dependabot** | GitHub nativo            | PRs autom�ticos de atualiza��o |
| **Renovate**   | Multi-plataforma         | Configur�vel, WhiteSource      |
| **Snyk**       | SCA + Container          | CLI, CI/CD, monitoramento      |
| **npm audit**  | npm registry             | CLI, gratuito                  |
| **Socket**     | An�lise de comportamento | Detecta malware e supply chain |

```bash
# npm audit (gratuito, b�sico)
npm audit --audit-level=high

# Snyk (mais completo)
npx snyk test --all-projects
npx snyk monitor  # monitoramento cont�nuo

# Renovate (config)
# renovate.json
{ "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "packageRules": [
    { "matchUpdateTypes": ["major"],
      "labels": ["breaking-change"],
      "automerge": false }
  ] }
```

**Regras no CI/CD**:

- Falhar build se vulnerabilidade CRITICAL
- Agendar scan semanal (cron)
- Monitorar depend�ncias indiretas (transitivas)

## Software Attestation

Attestations provam quem construiu, quando e como um artefato foi gerado:

```yaml
# GitHub Attestations (beta, 2025+)
name: build-and-attest
on:
  push:
    branches: [main]
jobs:
  attest:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: write
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/attest-build-provenance@v1
        with:
          subject-path: 'dist/*'
```
