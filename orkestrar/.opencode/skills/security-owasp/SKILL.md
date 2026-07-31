# security-owasp

> **Categoria**: security
> **Tags**: security, owasp, authentication, authorization, csp, secrets

Segurança baseada em OWASP: Top 10, ASVS, autenticação, autorização, CSP, secrets e dependências seguras.

## Quando Usar

Use ao realizar auditoria de segurança, implementar autenticação/autorização, revisar código ou configurar proteções contra ataques comuns.

## OWASP Top 10 (2021)

1. **Broken Access Control** — verificar permissões em cada operação
2. **Cryptographic Failures** — dados sensíveis não criptografados
3. **Injection** — SQL, NoSQL, OS command, LDAP — usar parameterized queries
4. **Insecure Design** — arquitetura sem considerar segurança
5. **Security Misconfiguration** — defaults inseguros, debug habilitado
6. **Vulnerable Components** — dependências desatualizadas
7. **Auth Failures** — session management fraco, senhas fracas
8. **Data Integrity Failures** — software sem verificação de integridade
9. **Logging & Monitoring** — sem logs de segurança
10. **SSRF** — server-side request forgery

## Autenticação

- Senhas: bcrypt (cost 12+) ou scrypt (NIST recomendado)
- JWT: assinar com RS256 (assimétrico), exp curta (15min), refresh token
- Session: httpOnly, secure, sameSite=strict
- MFA: TOTP (Google Authenticator) ou WebAuthn
- Rate limiting em login: 5 tentativas → delay de 1s crescente

## Autorização

- RBAC (Role-Based Access Control): papéis + permissões
- Verificar autorização em CADA operação (não só no login)
- Principio do menor privilégio
- Validar userId em operações: "este user pode acessar este recurso?"
- Evitar Insecure Direct Object Reference (IDOR)

## CSP (Content Security Policy)

```
Content-Security-Policy: default-src 'self';
  script-src 'self' 'strict-dynamic';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  base-uri 'none';
```

## Secrets Management

- NUNCA hardcodar secrets no código
- Usar variáveis de ambiente ou vault (HashiCorp Vault, AWS Secrets Manager)
- .env.example com placeholders, .env no .gitignore
- `git secrets` ou `talisman` para prevenir commit de secrets
- Rodar `npm audit` regularmente (CI/CD deve falhar se vulnerabilidade crítica)

## Anti-Patterns

- ❌ Senhas sem hash (texto plano) ou com MD5/SHA1
- ❌ JWT sem verificação de signature
- ❌ CORS configurado como `*` em produção
- ❌ `eval()` ou `new Function()` com input do usuário
- ❌ Logar senhas, tokens ou PII
