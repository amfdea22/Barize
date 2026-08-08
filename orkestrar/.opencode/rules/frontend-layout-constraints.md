# Frontend — Constrangimentos de Largura (max-w / overflow)

Regra que impede a reintrodução de bugs de layout onde containers com `max-w` + `w-full`
espremem ou cortam conteúdo (overflow horizontal) em viewports pequenas. Surgiu do **TC-001**
(divs da tela de login) e do **TC-019** (modal do QR code do cardápio): ambos usavam `max-w-*`
combinado com `w-full` e margens laterais, causando conteúdo cortado/espremido.

## Regra

**NUNCA combinar `w-full` (width: 100%) com margens horizontais (`mx-*`) no mesmo elemento**
quando esse elemento pode ultrapassar o viewport:

- ❌ `max-w-sm w-full mx-lg` → `w-full` = 100% + `mx-lg` = overflow horizontal
- ❌ `max-w-md w-full mx-auto` em modal sem wrapper com padding
- ❌ `max-w-lg w-full` sem `min-w-0` em filhos de flex container

## Padrão correto (ver `neonbar/frontend/src/components/Modal.tsx`)

```
<div className="fixed inset-0 z-50 overflow-y-auto">
  <div className="fixed inset-0 bg-black/60 backdrop-blur-[20px]" />
  <div className="flex min-h-full items-center justify-center p-4">
    <div className="w-full min-w-0 max-w-sm ...">
      {/* conteúdo */}
    </div>
  </div>
</div>
```

| O que fazer | Como |
|---|---|
| Limitar largura | `max-w-*` **sem** `w-full` juntos; usar wrapper `p-4` para margem |
| Centralizar modal | wrapper `flex min-h-full items-center justify-center p-4` |
| Evitar corte de conteúdo | `min-w-0` em filhos de flex; `max-h-[90vh] overflow-y-auto` |
| Largura responsiva | `w-full` + `max-w-*` em elemento **sem** `mx-*`, dentro de container com padding |

## Verificação (Validation Gate)

```bash
cd neonbar/frontend
# Deve retornar apenas os padrões corretos (w-full ... max-w-* em elemento SEM mx-*)
Select-String -Path "src/**/*.tsx" -Pattern "w-full.*mx-|mx-.*w-full|max-w-sm w-full" -AllMatches
```

## Origem

- **TC-001**: `max-w-lg`/`max-w-md` nas divs da tela de login espremiam o layout
- **TC-019**: modal do QR usava `max-w-sm w-full mx-lg` → overflow em viewport pequeno, cortando o QR
