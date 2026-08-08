# Frontend — Proibição de Recursos Externos (No CDN)

Regra que impede a reintrodução de dependências de serviços externos (CDNs, APIs de terceiros)
no frontend. Surgiu do TC-001 (imagens do login) e TC-019 (QR code do cardápio): ambos quebravam
sem acesso à internet e foram resolvidos servindo recursos localmente.

## Regra

**NUNCA referenciar URLs externas para recursos essenciais do sistema** em `neonbar/frontend/src`:

- ❌ Imagens de CDN (ex: `googleusercontent.com`, `transparenttextures.com`, `unsplash.com`)
- ❌ APIs de geração de QR code (ex: `api.qrserver.com`)
- ❌ Fontes externas (ex: Google Fonts) **se** a queda delas degradar o layout
- ❌ Qualquer `<img src="https://...">`, `<script src="https://...">`, `<link href="https://...">`
  apontando para terceiros

## O que fazer no lugar

| Necessidade | Solução local |
|---|---|
| Imagens (logo, fundo) | Salvar em `neonbar/backend/app/uploads/` e servir via `/uploads/...` (ver Login.tsx) |
| QR code | Gerar no browser com a lib `qrcode` (ver `Sidebar.tsx`, função `gerarQRCode`) |
| Fontes | Usar fontes do sistema ou bundle local via `@fontsource` |
| Ícones | Biblioteca local (`lucide-react`), nunca CDN de ícones |

## Exceções permitidas

- CDNs **opcionais** que não bloqueiam a funcionalidade principal (ex: analytics, mapa externo),
  **desde que** haja fallback local quando offline
- URLs externas geradas pelo usuário (ex: foto_url de produto com link remoto)

## Verificação (Validation Gate)

```bash
cd neonbar/frontend
# Deve retornar apenas o que estiver nas exceções permitidas
Select-String -Path "src/**/*.tsx" -Pattern "https?://(?!localhost)" -AllMatches
```

O lint do projeto (`npm run lint`, oxlint) não cobre isso — a verificação é manual/grep no Validation Gate.

## Origem

- **TC-001**: imagens do login vinham de CDN externo → baixadas para `uploads/`
- **TC-019**: QR code usava `api.qrserver.com` → trocado para geração local com `qrcode`
