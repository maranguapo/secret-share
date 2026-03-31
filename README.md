# 🔐 SecretShare

Compartilhe segredos com segurança. Criptografia AES-256-GCM no browser, zero-knowledge, auto-destruct.

## Como funciona

O segredo é cifrado **no seu browser** antes de sair do dispositivo. O servidor armazena apenas bytes cifrados — nunca o conteúdo em texto claro.
```
Você digita → AES-256-GCM cifra no browser → servidor recebe só ciphertext
Destinatário abre o link → digita a passphrase → browser descriptografa localmente
```

### Garantias de segurança

- **Zero-knowledge** — o servidor nunca vê o conteúdo do segredo
- **AES-256-GCM** — cifra autenticada, detecta adulteração dos dados
- **PBKDF2 (310k iterações)** — derivação de chave resistente a força bruta
- **Burn on read** — segredo apagado do banco após a primeira leitura
- **TTL configurável** — expira em 1h, 24h ou 7 dias
- **Rate limiting** — máximo 5 criações por IP a cada 10 minutos

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Criptografia | Web Crypto API nativa (sem dependências) |
| Banco de dados | PostgreSQL + Drizzle ORM |
| Cache / Rate limit | Redis + ioredis |
| Infraestrutura | Docker Compose |

## Pré-requisitos

- [Docker](https://docs.docker.com/engine/install/) e Docker Compose
- [Node.js 22+](https://nodejs.org/)

## Rodar localmente

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/secret-share.git
cd secret-share
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite o `.env.local` com suas configurações.

### 3. Sobe o Postgres e o Redis
```bash
docker compose up postgres redis -d
```

### 4. Instala dependências e roda as migrations
```bash
npm install
npm run db:migrate
```

### 5. Inicia o servidor de desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Deploy com Docker

### Build da imagem
```bash
docker build -t seu-usuario/secret-share:latest .
```

### Rodar em produção
```bash
docker compose up -d
```

### Publicar no Docker Hub
```bash
docker push seu-usuario/secret-share:latest
```

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão com o Postgres | `postgres://user:pass@localhost:5432/secretshare` |
| `REDIS_URL` | URL de conexão com o Redis | `redis://localhost:6379` |
| `NEXT_PUBLIC_APP_URL` | URL pública da aplicação | `https://seudominio.com` |

## Scripts disponíveis
```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run db:generate  # gera arquivos de migration
npm run db:migrate   # roda as migrations
npm run db:studio    # abre o Drizzle Studio (UI do banco)
```

## Estrutura do projeto
```
src/
├── app/
│   ├── page.tsx              # página de criação
│   └── s/[id]/page.tsx       # página de leitura
├── components/secret/
│   ├── CreateSecretForm.tsx  # formulário de criação
│   ├── SecretViewer.tsx      # exibição do segredo
│   └── ShareLinkCard.tsx     # card com o link gerado
├── lib/
│   ├── actions.ts            # server actions (create, read)
│   ├── ratelimit.ts          # rate limiting com Redis
│   ├── crypto/
│   │   ├── index.ts          # encrypt / decrypt (AES-GCM)
│   │   ├── passphrase.ts     # gerador de passphrase forte
│   │   └── shareLink.ts      # build / extract do link
│   └── db/
│       ├── client.ts         # conexão com o Postgres
│       └── schema.ts         # schema Drizzle
└── types/
    └── secret.ts             # tipos compartilhados
```

## Licença

MIT