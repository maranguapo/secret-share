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
- **HTTPS nativo** — certificado autoassinado gerado automaticamente no container

---

## Usar via Docker Hub (sem clonar o repositório)

A forma mais rápida de rodar o SecretShare é direto da imagem publicada.

### Pré-requisitos

- Docker e Docker Compose instalados
- PostgreSQL acessível
- Redis acessível

### `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB:       secretshare
      POSTGRES_USER:     secretshare
      POSTGRES_PASSWORD: sua_senha_aqui
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U secretshare"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  secretshare:
    image: maranguapo/secret-share:latest
    restart: unless-stopped
    ports:
      - "8443:3000"
    environment:
      SECRETSHARE_DB_URL:      postgres://secretshare:sua_senha_aqui@postgres:5432/secretshare
      SECRET_SHARE_REDIS_URL:  redis://redis:6379
      SECRETSHARE_BASE_URL:    https://seu-ip-ou-dominio:8443
    volumes:
      - secretshare_certs:/app/certs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
  secretshare_certs:
```

### Subir
```bash
docker compose up -d
```

As migrations são executadas automaticamente na primeira inicialização. Acesse `https://seu-ip:8443` — na primeira vez o browser vai alertar sobre o certificado autoassinado, clique em **Avançado → Prosseguir**.

### Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `SECRETSHARE_DB_URL` | URL de conexão com o PostgreSQL | `postgres://user:pass@host:5432/secretshare` |
| `SECRET_SHARE_REDIS_URL` | URL de conexão com o Redis | `redis://host:6379` |
| `SECRETSHARE_BASE_URL` | URL pública da aplicação | `https://192.168.1.12:8443` |

### Atualizar para nova versão
```bash
docker compose pull
docker compose up -d
```

---

## Desenvolver / Contribuir

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Criptografia | Web Crypto API nativa (sem dependências) |
| Banco de dados | PostgreSQL + Drizzle ORM |
| Cache / Rate limit | Redis + ioredis |
| Infraestrutura | Docker Compose |

### Pré-requisitos

- Docker e Docker Compose
- Node.js 22+

### Setup local
```bash
# 1. Clone o repositório
git clone https://github.com/maranguapo/secret-share.git
cd secret-share

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# edite .env.local com suas configurações

# 3. Sobe o Postgres e o Redis
docker compose up postgres redis -d

# 4. Instala dependências e roda as migrations
npm install
npm run db:migrate

# 5. Inicia o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts disponíveis
```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run db:generate  # gera arquivos de migration
npm run db:migrate   # roda as migrations
npm run db:studio    # abre o Drizzle Studio (UI do banco)
```

### Publicar nova versão
```bash
./release.sh 1.0.0
```

Para sobrescrever uma versão existente sem criar novo commit:
```bash
./release.sh 1.0.0 --overwrite
```

### Estrutura do projeto
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
│       ├── client.ts         # conexão com o PostgreSQL
│       └── schema.ts         # schema Drizzle
└── types/
    └── secret.ts             # tipos compartilhados
```

## Licença

MIT