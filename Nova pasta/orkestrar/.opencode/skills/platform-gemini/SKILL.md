# platform-gemini

> **Categoria**: platform
> **Tags**: gemini, google, ai-studio, platform, code-assist, google-cloud

Gemini Code Assist / Google AI Studio specifics: Gemini config format, 1M+ context window, Google Cloud integration, system instructions, file context, Gemini API conventions.

## Quando Usar

Use ao configurar projetos para Google Gemini, escrever system instructions, otimizar contexto de 1M tokens ou integrar com Google Cloud services.

## Configuration Format

**Gemini Code Assist** � configura��o no reposit�rio:

```
.gemini/
+-- code-assist/
    +-- config.yaml
```

**config.yaml**:

```yaml
version: 1
project:
  name: my-project
  language: typescript
  test_framework: vitest
  lint: eslint
  conventions:
    - 'TypeScript strict mode'
    - 'Conventional Commits'
    - 'Tests alongside modules'

rules:
  - pattern: 'src/**/*.ts'
    instructions: |
      Use strict TypeScript with explicit types.
      Prefer interfaces for public APIs, types for unions.
      Use async/await over raw promises.

  - pattern: 'src/api/**/*.ts'
    instructions: |
      All endpoints must validate inputs with Zod.
      Return consistent error format: { error: string, code: string }.
```

## Context Window Usage

Gemini 2.5 Pro tem **1M+ tokens** de contexto (~800K palavras):

- Pode processar reposit�rios inteiros de uma vez
- Capacidade de "an�lise global" do c�digo

**Estrat�gia de contexto otimizada**:
| Tamanho do Projeto | Abordagem | Benef�cio |
|--------------------|-----------|-----------|
| < 100K tokens | Carregar tudo | An�lise completa |
| 100K-500K | Carregar + instru��es | Contexto suficiente |
| > 500K | Priorizar arquivos alterados | Foco no que importa |

**Dicas**:

- Incluir `package.json`, `tsconfig.json` no contexto (entender stack)
- System instructions no in�cio t�m mais peso
- Contexto longo ? resposta mais lenta (custo computacional)
- **Evitar**: arquivos bin�rios, lockfiles, builds

## Google Cloud Integration

**Vertex AI** � Gemini via Google Cloud:

```python
from vertexai.generative_models import GenerativeModel

model = GenerativeModel("gemini-2.5-pro")
response = model.generate_content("Generate unit tests for this code")
```

**Code Assist** integrado com:

- **Cloud Code IDE**: VS Code, JetBrains
- **Cloud Workstations**: ambientes de desenvolvimento gerenciados
- **Artifact Registry**: an�lise de vulnerabilidades em imagens
- **Cloud Build**: sugest�es em PRs

**Autentica��o**:

```bash
gcloud auth application-default login
gcloud config set project my-project
```

- Service account para CI/CD
- IAM roles: `aiplatform.user` para acesso Vertex AI

## System Instructions

**Instru��es de sistema** no Gemini Code Assist:

```yaml
# .gemini/code-assist/config.yaml
system_instructions:
  - 'You are an expert TypeScript developer.'
  - "You work on an observability framework called 'orkestrar'."
  - "You MUST follow the project's AGENTS.md and DESIGN.md."
  - 'You prefer simple solutions over clever ones.'
  - 'Always include test suggestions when proposing code changes.'
```

**Caracter�sticas**:

- At� 1000 caracteres por instru��o
- Ordem importa: primeiras instru��es t�m mais peso
- Linguagem natural, sem formata��o especial
- Podem referenciar arquivos: `Follow the patterns defined in DESIGN.md`

**Boas pr�ticas**:

- Ser espec�fico: "Use Vitest" > "Use a test framework"
- Definir regras de estilo, n�o apenas conte�do
- Incluir restri��es: "Never use `any` type"
- Instru��es curtas e diretas (4-8 por projeto)

## API Conventions

**Gemini API** (n�o Code Assist):

```python
import google.generativeai as genai

genai.configure(api_key="AIza...")
model = genai.GenerativeModel("gemini-2.5-pro")

response = model.generate_content(
    "Explain this code: " + code,
    generation_config={
        "temperature": 0.2,
        "max_output_tokens": 2048,
    },
    safety_settings={
        "HARASSMENT": "BLOCK_ONLY_HIGH",
    },
)
```

**Modelos dispon�veis**:
| Modelo | Contexto | Caso de Uso |
|--------|----------|-------------|
| gemini-2.5-pro | 1M tokens | An�lise de c�digo, racioc�nio complexo |
| gemini-2.5-flash | 1M tokens | Respostas r�pidas, tarefas simples |
| gemini-2.0-flash-lite | 1M tokens | Mais econ�mico, baixa lat�ncia |

- **System instruction**: par�metro `system_instruction` (n�o no prompt)
- **Structured output**: `response_mime_type: "application/json"` + schema
- **Safety settings**: configur�vel por categoria (HARASSMENT, HATE_SPEECH, etc.)

## Limitations & Workarounds

| Limita��o                        | Impacto               | Workaround                               |
| -------------------------------- | --------------------- | ---------------------------------------- |
| Sem tools nativos (bash, fs)     | N�o modifica arquivos | Usar via Code Assist (IDE)               |
| Contexto reduz ap�s muitos turns | Perde foco            | Refor�ar instru��es-chave periodicamente |
| Rate limits (API)                | 60 req/min (free)     | Usar tier pago para produ��o             |
| Sem MCP nativo                   | Extens�es limitadas   | Usar Vertex AI Agent Builder             |

**Gemini + GitHub**:

- Gemini Code Assist integra com PRs no GitHub
- Sugest�es autom�ticas em PRs
- Revis�o de c�digo multi-arquivo

**Diferen�as para Claude/Copilot**:

- Maior contexto (1M vs 200K)
- Sem tools nativos (ao contr�rio de Claude Code)
- Foco em Google Cloud, mas funcional independente
- Config em YAML (vs CLAUDE.md markdown)
