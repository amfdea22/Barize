# security

> **Categoria**: security
> **Tags**: owasp, sast, sca, secrets, cve, secure-coding, authentication, authorization

Segurança de software: OWASP Top 10, SAST/SCA, detecção de secrets, gerenciamento de CVE, autenticação, autorização e boas práticas de codificação segura.

## Quando Usar

Use ao revisar segurança de código, configurar ferramentas SAST/SCA, analisar vulnerabilidades, implementar autenticação/autorização, ou aplicar secure coding patterns.

## OWASP Top 10 (2021)

As vulnerabilidades mais críticas em aplicações web:

1. **Broken Access Control** — Falhas em autorização (IDOR, path traversal, privilege escalation)
2. **Cryptographic Failures** — Dados sensíveis não criptografados, TLS fraco, hashing inseguro
3. **Injection** — SQL, NoSQL, OS command, LDAP injection (sempre usar parameterized queries)
4. **Insecure Design** — Falhas arquiteturais (falta de rate limiting, threat modeling)
5. **Security Misconfiguration** — Default credentials, debug ativo, CORS permissivo
6. **Vulnerable Components** — Dependências desatualizadas (usar `npm audit`, `pip audit`, `grype`)
7. **Authentication Failures** — Senhas fracas, session fixation, MFA ausente
8. **Data Integrity Failures** — Serialização insegura, supply chain (verificarassinaturas)
9. **Logging & Monitoring** — Falta de audit logging, detecção tardia de incidentes
10. **SSRF** — Server-Side Request Forgery (validar URLs, allowlist de destinos)

## SAST — Static Application Security Testing

```yaml
# Ferramentas por ecossistema
# TypeScript/JavaScript:    eslint-plugin-security, semgrep
# Python:                   bandit, semgrep, ruff (regras de segurança)
# Go:                       gosec, staticcheck
# Rust:                     cargo-audit, clippy (regras de segurança)
# Java:                     FindSecBugs, PMD
# Multi-language:           semgrep, sonarqube, codeql
```

Boas práticas:
- Executar SAST em **todo PR** (CI pipeline, gate bloqueante)
- Usar regras customizadas para o domínio da aplicação (ex: semgrep)
- Remediar vulnerabilities críticas/altas antes do merge
- Falso positivos: documentar e silenciar com `# nosemgrep` ou `.semgrepignore`

## SCA — Software Composition Analysis

```bash
# Exemplos de comandos para verificar dependências
# Node.js:                npm audit, npm audit --audit-level=moderate
# Python:                 pip-audit, safety check
# Go:                     govulncheck ./...
# Rust:                   cargo audit
# Multi-language:         grype, trivy, snyk, dependabot
```

Estratégia:
- **Pre-commit**: `npm audit` (non-blocking warning)
- **CI nightly**: Escaneamento completo com grype/trivy
- **Dependabot/Renovate**: Automação de PRs para atualizações
- **SBOM**: Gerar CycloneDX/SPDX (`npm sbom`, `cyclonedx-bom`)

## Detecção de Secrets

```bash
# Ferramentas
# git-secrets:    Escaneia commits por padrões de secrets
# truffleHog:     Análise profunda de histórico git
# gitleaks:       Detecção com regras configuráveis
# detect-secrets: Mantém baseline de falsos positivos

# Exemplo: escanear commits recentes
gitleaks detect --source . --verbose
```

Prevenção:
- **NUNCA** commitar: `API_KEY=`, `password=`, `-----BEGIN RSA PRIVATE KEY-----`
- Usar `.gitallowed` ou `.gitleaks.toml` para falsos positivos documentados
- Pre-commit hook com `gitleaks` ou `trufflehog`
- Rotacionar secrets imediatamente se detectados no repositório
- Usar cofre de secrets (Vault, AWS Secrets Manager, GitHub Secrets)

## Secure Coding Patterns

### Input Validation

```typescript
// Sempre validar entrada na camada mais externa
function processUserInput(input: string): string {
  // Allowlist > denylist
  const SAFE_PATTERN = /^[a-zA-Z0-9 _-]+$/;
  if (!SAFE_PATTERN.test(input)) {
    throw new ValidationError('Input contains invalid characters');
  }
  return sanitizeHtml(input); // Anti-XSS
}
```

```python
from pydantic import BaseModel, Field, EmailStr

class UserInput(BaseModel):
    name: str = Field(min_length=1, max_length=100, pattern=r'^[a-zA-Z ]+$')
    email: EmailStr
    age: int = Field(ge=0, le=150)
```

### Authentication

```typescript
import { hash, verify } from 'argon2'; // Usar argon2, NÃO bcrypt (mais resistente a GPU)

async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    type: argon2.argon2id, // Recomendado OWASP
    memoryCost: 65536,     // 64 MB
    timeCost: 3,           // 3 passes
    parallelism: 4,
  });
}
```

### Authorization (RBAC)

```typescript
type Role = 'admin' | 'editor' | 'viewer';
type Permission = 'create' | 'read' | 'update' | 'delete';

const RBAC_MAP: Record<Role, Permission[]> = {
  admin:  ['create', 'read', 'update', 'delete'],
  editor: ['create', 'read', 'update'],
  viewer: ['read'],
};

function checkAccess(role: Role, permission: Permission): void {
  if (!RBAC_MAP[role]?.includes(permission)) {
    throw new ForbiddenError(`Role ${role} missing permission ${permission}`);
  }
}
```

## Security Headers (HTTP)

```yaml
# Configuração recomendada para aplicações web
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Rate Limiting & Proteção

```typescript
// Exemplo: rate limiting com sliding window
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  entry.count++;
  return entry.count <= maxRequests;
}
```

## Checklist de Segurança

- [ ] SAST executado e sem issues críticas/altas
- [ ] SCA executado e sem CVEs conhecidas (ou documentadas)
- [ ] Nenhum secret exposto no diff (gitleaks/trufflehog)
- [ ] Input validation em TODAS as entradas externas
- [ ] Autenticação usa algoritmo moderno (argon2id)
- [ ] Autorização verificada em cada endpoint (não só no frontend)
- [ ] CSP configurado (evitar `'unsafe-inline'`)
- [ ] Rate limiting em endpoints sensíveis (login, API)
- [ ] Headers de segurança presentes
- [ ] Logs sem dados sensíveis (PII, tokens, senhas)
- [ ] Dependências atualizadas (sem vulns conhecidas)
- [ ] CORS configurado com allowlist estrita
- [ ] Proteção SSRF (URL validation, denylist de IPs internos)
