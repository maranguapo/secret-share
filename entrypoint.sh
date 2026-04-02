#!/bin/sh
set -e

echo "→ Criando .env em runtime..."
cat > /app/.env << EOF
DATABASE_URL=${SECRETSHARE_DB_URL}
REDIS_URL=${SECRETSHARE_REDIS_URL}
NEXT_PUBLIC_APP_URL=${SECRETSHARE_BASE_URL}
EOF

echo "→ Rodando migrations..."
node migrate.js

echo "→ Iniciando aplicação..."
exec node server-https.js