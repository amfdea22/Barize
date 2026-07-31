# graphql

> **Categoria**: backend
> **Tags**: graphql, apollo, dataloader, subscriptions, federation, codegen

GraphQL: schema design, resolvers, N+1 problem (DataLoader), mutations, subscriptions, federation (Apollo), security (depth limiting, auth, rate limiting), codegen.

## Quando Usar

Use ao projetar APIs GraphQL, definir schemas, implementar resolvers, configurar federa��o, ou otimizar performance.

## Schema Design

```graphql
type User {
  id: ID!
  name: String!
  email: String! # @deprecated reason: "Use emailVerified"
  emailVerified: EmailAddress # custom scalar
  posts(limit: Int = 10): [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  body: String!
  author: User!
  comments: [Comment!]!
  createdAt: DateTime!
}

input CreatePostInput {
  title: String! @constraint(minLength: 3, maxLength: 200)
  body: String! @constraint(minLength: 10)
}

type Query {
  user(id: ID!): User
  users(search: String, limit: Int = 20): [User!]!
  posts(authorId: ID): [Post!]!
}

type Mutation {
  createPost(input: CreatePostInput!): Post!
}
```

- **Nouns (tipos) sobre verbs (mutations nomeadas como a��es)**
- **Input types** para mutations complexas
- **Custom scalars**: `DateTime`, `EmailAddress`, `JSON`
- **Interfaces**: `interface Node { id: ID! }` para types com ID
- **@constraint**: valida��o declarativa no schema

## Resolvers & DataLoader

```typescript
const resolvers = {
  Query: {
    user: async (_parent: unknown, args: { id: string }, ctx: Context) => {
      return ctx.dataSources.users.findById(args.id);
    },
  },
  User: {
    posts: async (user: User, _args: unknown, ctx: Context) => {
      return ctx.dataSources.posts.findByAuthorId(user.id);
    },
  },
};
```

**DataLoader** (solu��o N+1):

```typescript
import DataLoader from 'dataloader';

// Batch function
const userLoader = new DataLoader<string, User>(async (ids) => {
  const users = await db.select('*').from('users').whereIn('id', ids);
  // Must return in same order as ids
  return ids.map((id) => users.find((u) => u.id === id) || null);
});

// Uso no resolver
const resolvers = {
  Post: {
    author: (post: Post, _args: unknown, ctx: Context) => {
      return ctx.loaders.userLoader.load(post.authorId);
    },
  },
};
```

- **DataLoader por recurso**: `userLoader`, `postLoader`, `commentLoader`
- **Cache por request**: criar DataLoaders no contexto de cada request
- **Avoid N+1**: sempre usar DataLoader para rela��es 1-N

## Subscriptions

```graphql
type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
  userOnline(userId: ID!): Boolean!
}
```

**Implementa��o (WebSocket)**:

```typescript
import { PubSub } from 'graphql-subscriptions';
const pubsub = new PubSub();

const resolvers = {
  Subscription: {
    commentAdded: {
      subscribe: (_parent: unknown, args: { postId: string }) => {
        return pubsub.asyncIterator([`COMMENT_ADDED_${args.postId}`]);
      },
    },
  },
  Mutation: {
    addComment: async (_parent: unknown, args: AddCommentInput) => {
      const comment = await addCommentToDb(args);
      pubsub.publish(`COMMENT_ADDED_${args.postId}`, { commentAdded: comment });
      return comment;
    },
  },
};
```

**Transporte**:

- **WebSocket**: Apollo WS (graphql-ws), real-time bidirecional
- **SSE**: Server-Sent Events (mais simples, apenas server?client)
- **Live queries**: alternativa via @live directive (n�o padr�o)

## Federation (Apollo)

**Apollo Federation** � GraphQL distribu�do entre microsservi�os:

```graphql
# User Service � type extension
type User @key(fields: "id") {
  id: ID!
  name: String!
  email: String!
}

# Post Service � extends User
type User @key(fields: "id") @extends {
  id: ID! @external
  posts: [Post!]!
}

type Post @key(fields: "id") {
  id: ID!
  title: String!
  author: User!
}
```

**Federation 2** (simplificado):

```graphql
# Entidade compartilhada entre servi�os
type Product @key(fields: "upc") {
  upc: String!
  name: String!
  reviews: [Review!]! @requires(fields: "upc")
}
```

- **Supergraph**: schema unificado gerado pelo Rover CLI
- **Router (Apollo)**: gateway que roteia queries para subgraphs
- **@shareable**: campos que m�ltiplos subgraphs podem resolver
- **@requires**: campo que depende de outro campo para ser resolvido

## Security

**Depth limiting** (evitar queries recursivas profundas):

```typescript
import depthLimit from 'graphql-depth-limit';
const server = new ApolloServer({
  validationRules: [depthLimit(10)],
  // ...
});
```

**Query complexity** (evitar queries caras):

```graphql
# Complexity por field
type Query {
  users: [User!]! @complexity(value: 10)
  expensiveReport: JSON @complexity(value: 100)
}
```

**Auth por resolver**:

```typescript
const resolvers = {
  Query: {
    user: authenticated(async (_parent, args, ctx) => {
      if (ctx.user.role !== 'admin') throw new ForbiddenError();
      return findUser(args.id);
    }),
  },
  Mutation: {
    deletePost: authorized('post:delete', async (_parent, args, ctx) => {
      return deletePost(args.id);
    }),
  },
};
```

**Rate limiting**:

- Por IP, por API key, por operation type
- Esquema: custo por query (soma dos complexities) x requests
- Ferramentas: graphql-rate-limit, rate-limit-redis

## Tooling (Codegen)

**GraphQL Code Generator**:

```yaml
# codegen.yml
schema: './src/**/*.graphql'
documents: './src/**/*.graphql'
generates:
  ./src/generated/types.ts:
    plugins:
      - typescript
      - typescript-resolvers
      - typescript-operations
  ./src/generated/hooks.ts:
    plugins:
      - typescript-react-query
```

**Ferramentas de desenvolvimento**:

- **GraphiQL**: IDE no navegador (embedded Apollo Studio)
- **Apollo Studio Sandbox**: playground + schema explorer
- **Voyager**: visualiza��o de grafo do schema
- **Rover CLI**: valida��o e publica��o de schema (Apollo Federation)

**Best practices**:

- **Codegen** em CI: garantir que schema e c�digo est�o sincronizados
- **Schema registry**: versionar schema (Apollo Studio ou Hive)
- **Operation safelisting**: permitir apenas operations conhecidas (produ��o)
- **Persisted queries**: queries pr�-registradas (reduz tamanho do request)
