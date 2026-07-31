# nextjs

> **Categoria**: frontend
> **Tags**: nextjs, react, app-router, server-components, server-actions, ssr, isr

Next.js 14+: App Router, React Server Components (RSC), Server Actions, rendering strategies (SSR/SSG/ISR), middleware, Edge Runtime, API routes, autentica��o (NextAuth.js), SEO e deploy.

## Quando Usar

Use ao construir aplica��es React full-stack com Next.js, configurar rotas e layouts, gerenciar rendering strategy, implementar autentica��o ou otimizar SEO e performance.

## App Router

O App Router (`app/`) substitui o Pages Router (`pages/`):

```
app/
+-- layout.tsx              ? Layout raiz (obrigat�rio)
+-- page.tsx                ? Rota raiz (/)
+-- about/
�   +-- page.tsx            ? /about
+-- users/
�   +-- layout.tsx          ? Layout compartilhado
�   +-- page.tsx            ? /users
�   +-- [id]/
�       +-- page.tsx        ? /users/123 (dynamic route)
+-- api/
�   +-- users/
�       +-- route.ts        ? /api/users (API route)
+-- (marketing)/
�   +-- layout.tsx          ? Route group (sem /marketing na URL)
�   +-- page.tsx
+-- _components/            ? Pasta privada (n�o � rota)
    +-- header.tsx
```

**Conceitos chave**:

- `layout.tsx` � compartilhado entre p�ginas filhas (persiste estado)
- `loading.tsx` � UI de loading autom�tico (Suspense boundary)
- `error.tsx` � Error boundary por segmento de rota
- `not-found.tsx` � 404 customizado
- `template.tsx` � como layout, mas re-monta em cada navega��o
- `(group)` � route groups para organizar sem afetar URL
- `_folder` � private folders (n�o acess�veis como rota)

## React Server Components (RSC)

Por padr�o, componentes no App Router s�o Server Components:

```typescript
// Server Component (padr�o) � renderizado no servidor
// Pode ser async, acessa DB diretamente, N�O usa hooks
async function UserList() {
  const users = await db.user.findMany()  // acesso direto ao banco
  return (
    <ul>
      {users.map(u => <li key={u.id}>{u.name}</li>)}
    </ul>
  )
}
```

**Client Component** � adicione `'use client'` para interatividade:

```typescript
'use client'

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

**O que vai em Server vs Client**:

| Server Component ?                 | Client Component ?                 |
| ---------------------------------- | ---------------------------------- |
| Acesso a banco, FS, APIs           | useState, useEffect, useReducer    |
| Tokens sens�veis (DB creds)        | Event handlers (onClick, onSubmit) |
| Depend�ncias pesadas (server-side) | Browser APIs (localStorage, etc.)  |
| SEO-critical content               | Interatividade e anima��es         |
| Componentes est�ticos              | Context providers                  |

Regra de ouro: Server por padr�o, Client quando precisar de interatividade.

## Server Actions

Server Actions permitem muta��es no servidor sem API expl�cita:

```typescript
// app/users/create/page.tsx
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
})

export async function createUser(formData: FormData) {
  'use server'  // ou em arquivo separado com 'use server' no topo

  const parsed = schema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
  })

  await db.user.create({ data: parsed })
  revalidatePath('/users')  // atualiza cache da lista
}

// No componente:
function CreateUserForm() {
  return (
    <form action={createUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Criar</button>
    </form>
  )
}
```

**Server Action + Client**:

```typescript
'use client'
import { createUser } from './actions'

export function ClientForm() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  )
}
```

**Boas pr�ticas**:

- Valida��o sempre server-side (Zod, Valibot)
- `useActionState()` (React 19) para feedback de loading/erro
- `revalidatePath()` ou `revalidateTag()` ap�s muta��o
- `redirect()` ap�s sucesso (em vez de navega��o client)

## Rendering Strategies

| Strategy          | Onde renderiza               | Quando                    | Cache             |
| ----------------- | ---------------------------- | ------------------------- | ----------------- |
| **Static (SSG)**  | Build time                   | Conte�do imut�vel         | CDN edge          |
| **Dynamic (SSR)** | Request time                 | Dados personalizados      | Por request       |
| **ISR**           | Build + revalidate on demand | Dados que mudam raramente | CDN + revalida��o |
| **Edge**          | Edge network                 | M�nima lat�ncia           | Global            |

```typescript
// Static (default) � gera no build
// app/page.tsx (sem fetch din�mico)

// Dynamic � fetch sem cache (por request)
// app/users/[id]/page.tsx
async function UserPage({ params }: { params: { id: string } }) {
  const user = await fetch(`https://api.example.com/users/${params.id}`, {
    cache: 'no-store',  // for�a SSR
  })
  return <div>{user.name}</div>
}

// ISR � revalida a cada 60s
async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  })
}

// On-demand ISR (webhook)
// app/api/revalidate/route.ts
export async function POST(req: Request) {
  const { path } = await req.json()
  revalidatePath(path)
  return Response.json({ revalidated: true })
}
```

**`dynamic` config**:

```typescript
export const dynamic = 'force-static'; // for�a SSG
export const dynamic = 'force-dynamic'; // for�a SSR
export const revalidate = 60; // ISR
```

## Middleware & Authentication

**Middleware** � Edge Runtime, executa antes de cada request:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/login'],
};
```

**NextAuth.js (Auth.js v5)**:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

const handler = NextAuth({
  providers: [GitHub({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET })],
  callbacks: {
    session({ session, token }) {
      return { ...session, userId: token.sub };
    },
  },
});

export { handler as GET, handler as POST };
```

**Prote��o Server Component**:

```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')
  return <div>Welcome {session.user?.name}</div>
}
```

## Deploy & Performance

**Op��es de deploy**:

| Plataforma  | Tipo                               | Serverless | Edge            | ISR |
| ----------- | ---------------------------------- | ---------- | --------------- | --- |
| **Vercel**  | Otimizado Next.js                  | ?          | ?               | ?   |
| **Netlify** | Suporte via @netlify/plugin-nextjs | ?          | Limitado        | ?   |
| **Docker**  | Auto-hosted (Node.js)              | ?          | ?               | ?   |
| **AWS**     | Lambda + CloudFront                | ?          | ? (Lambda@Edge) | ?   |

**Vercel config** (recomendado):

```json
// vercel.json
{
  "framework": "nextjs",
  "regions": ["gru1", "iad1"], // m�ltiplas regi�es
  "rewrites": [{ "source": "/blog/:path*", "destination": "/news/:path*" }]
}
```

**Performance**:

- `next/image` � otimiza��o autom�tica de imagens
- `next/font` � font loading otimizado (CSS size-adjust)
- `next/link` � prefetch autom�tico de p�ginas vis�veis
- Streaming: `loading.tsx` segments + Suspense boundaries
- Partial Prerendering (PPR, experimental) � combina static + dynamic na mesma p�gina

```typescript
import Image from 'next/image'
import { Geist } from 'next/font/google'

const geist = Geist({ subsets: ['latin'] })

export default function Page() {
  return (
    <>
      <h1 className={geist.className}>Hello</h1>
      <Image
        src="/hero.png"
        alt="Hero image"
        width={1200}
        height={600}
        priority  // LCP optimization
      />
    </>
  )
}
```

**M�tricas Core Web Vitals**:

- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1
