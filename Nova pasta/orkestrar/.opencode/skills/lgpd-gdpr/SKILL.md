# lgpd-gdpr

> **Categoria**: security
> **Tags**: lgpd, gdpr, privacy, compliance, data-protection, consent

LGPD/GDPR compliance: data protection principles, consent management, right to erasure, data portability, DPA, data mapping, privacy by design, breach notification procedures.

## Quando Usar

Use ao projetar sistemas que processam dados pessoais, implementar consentimento, gerenciar right to erasure, ou garantir conformidade com leis de prote��o de dados.

## Key Principles (LGPD/GDPR)

**LGPD (Lei 13.709/2018)** � 10 bases legais:
| Base Legal | Quando Aplicar |
|------------|----------------|
| Consentimento | Usu�rio autoriza explicitamente |
| Cumprimento legal | Obriga��o prevista em lei |
| Execu��o de contrato | Necess�rio para prestar servi�o |
| Leg�timo interesse | Interesse leg�timo do controlador |
| Prote��o ao cr�dito | An�lise de cr�dito (LGPD espec�fica) |

**GDPR** � 6 bases legais similares + condi��es adicionais

**Princ�pios comuns**:

- **Finalidade**: prop�sitos espec�ficos e informados
- **Adequa��o**: compat�vel com a finalidade informada
- **Necessidade**: m�nimo necess�rio para atingir finalidade
- **Transpar�ncia**: informa��es claras ao titular
- **N�o discrimina��o**: sem tratamento para fins discriminat�rios

## Consent Management

**Coleta de consentimento**:

```typescript
interface ConsentRecord {
  userId: string;
  purposes: ConsentPurpose[];
  grantedAt: Date;
  expiresAt?: Date;
  ip: string;
  userAgent: string;
  version: string; // vers�o da pol�tica de privacidade
}

enum ConsentPurpose {
  NEWSLETTER = 'newsletter',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PROFILING = 'profiling',
}
```

**Regras**:

- **Opt-in** (n�o opt-out): sil�ncio n�o � consentimento
- **Granular**: consentimento por finalidade (n�o tudo-ou-nada)
- **Revog�vel**: t�o f�cil dar quanto retirar
- **Documentado**: prova de consentimento armazenada
- **Renova��o**: re-consentimento peri�dico (ex: anual)
- **Crian�as**: consentimento dos pais (< 16 anos GDPR, < 18 LGPD)

## Right to Erasure & Portability

**Right to Erasure (Art. 18 LGPD / Art. 17 GDPR)**:

```typescript
async function deleteUserData(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Anonimizar ou deletar dados pessoais
    await tx.user.update({
      where: { id: userId },
      data: {
        name: '[DELETED]',
        email: `deleted-${userId}@redacted.local`,
        phone: null,
        deletedAt: new Date(),
      },
    });

    // 2. Deletar dados de tracking
    await tx.analytics.deleteMany({ where: { userId } });

    // 3. Anonimizar logs
    await tx.auditLog.updateMany({
      where: { userId },
      data: { userId: null, userIp: null },
    });

    // 4. Manter apenas dados obrigat�rios (fiscais, contratuais)
    // (com retention period definido)
  });
}
```

**Right to Portability**:

```typescript
async function exportUserData(userId: string): Promise<ExportDTO> {
  const user = await tx.user.findUnique({ where: { id: userId } });
  const orders = await tx.order.findMany({ where: { userId } });
  const profiles = await tx.profile.findMany({ where: { userId } });

  return {
    format: 'json',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      profile: user,
      orders,
      usageData: profiles,
    },
  };
}
```

- **Prazo**: 15 dias (LGPD), 30 dias (GDPR) para atender
- **Formato**: JSON, CSV (machine-readable, interoper�vel)
- **Exce��es**: obriga��es legais, direitos de terceiros

## Privacy by Design

**7 Princ�pios fundamentais**:

1. **Proativo, n�o reativo**: privacy desde o design, n�o ap�s incidente
2. **Privacy as default**: coleta m�nima, sem opt-out
3. **Embedded into design**: privacy n�o � add-on, � parte da arquitetura
4. **Full functionality**: privacy + funcionalidade (n�o trade-off)
5. **End-to-end security**: prote��o em todo ciclo de vida
6. **Visibility and transparency**: processos audit�veis
7. **Respect for user privacy**: centrado no titular

**Implementa��o pr�tica**:

```typescript
// Privacy as default � dados n�o solicitados n�o s�o coletados
class UserRegistration {
  register(dto: RegisterDTO): User {
    return new User({
      email: dto.email,
      // N�O coletar: ip, userAgent, location, etc.
      // A menos que explicitamente consentido
    });
  }
}

// Data minimization � armazenar apenas necess�rio
interface User {
  id: string;
  email: string; // necess�rio para login
  hashedPassword: string; // necess�rio para auth
  // N�O armazenar: birthDate, gender, race (se n�o essencial)
}
```

## Data Mapping

**Registro das Opera��es (LGPD Art. 37)**:

```yaml
data_flows:
  - id: DF-001
    name: User Registration
    controller: Company X
    data_categories:
      - personal_data: [name, email, phone]
      - sensitive_data: [] # none collected
    processing_purpose: Account creation and management
    legal_basis: Contract execution
    retention: Active account + 5 years after closure
    data_subjects: [users, customers]
    recipients:
      - internal: [billing, support]
      - external: [payment-processor, email-service]
    transfers:
      - country: US
        safeguard: Standard Contractual Clauses (SCC)
    security_measures:
      - encryption_at_rest: AES-256
      - encryption_in_transit: TLS 1.3
      - access_control: RBAC with audit logs
```

**Ferramentas**: Atlas, IRI FieldShield, OneTrust

- Mapear todo fluxo de dados pessoais
- Identificar dados sens�veis (sa�de, biometria, religi�o, etc.)
- Documentar transfer�ncias internacionais (SCC, DPA)

## Breach Notification

**Procedimento de notifica��o**:

```
Descoberta de Incidente
     �
     ?
[1h] Containment: isolar sistemas afetados
     �
     ?
[4h] Assessment: determinar escopo, dados envolvidos, risco
     �
     ?
[24h] Notification (se alto risco):
      �  +-- ANPD (LGPD) ou Supervisory Authority (GDPR)
      �  +-- Titulares afetados
     �
     ?
[7d] Detailed report: causa raiz, a��es corretivas, preven��o
```

**Template de notifica��o � autoridade**:

```yaml
breach_report:
  nature: 'Ransomware attack on production database'
  data_subjects_affected: 15000
  data_categories: [name, email, hashed_password, address]
  likely_consequences: 'Identity theft risk, phishing vulnerability'
  measures_taken: 'Isolated server, rotated credentials, notified users'
  contact: dpo@company.com
```

**Documenta��o interna**:

- Incident response plan documentado
- Logs de acesso audit�veis
- DPA (Data Protection Agreement) com todos os processadores
- **LGPD**: notifica��o em at� **2 dias �teis** � ANPD
- **GDPR**: notifica��o em at� **72 horas** � Supervisory Authority
