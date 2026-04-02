FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

COPY --from=builder /app/public              ./public
COPY --from=builder /app/.next/standalone    ./
COPY --from=builder /app/.next/static        ./.next/static
COPY --from=builder /app/drizzle             ./drizzle
COPY --from=builder /app/migrate.js          ./migrate.js
COPY --from=builder /app/entrypoint.sh       ./entrypoint.sh
COPY --from=builder /app/server-https.js     ./server-https.js
COPY --from=deps    /app/node_modules        ./node_modules

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["sh", "entrypoint.sh"]