FROM node:22-slim AS base
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install

FROM deps AS builder
COPY prisma ./prisma
COPY prisma.config.ts nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY src/modules/common/mail/templates ./dist/modules/common/mail/templates
COPY src/modules/common/mail/templates ./src/modules/common/mail/templates

# Directorio donde el compose monta (bind-mount) el service account de
# reCAPTCHA en runtime. Se crea en la imagen para garantizar que el destino
# del montaje exista siempre como directorio.
RUN mkdir -p /app/credentials

EXPOSE 3000

# Healthcheck HTTP contra GET / (sin auth). Lee PORT del entorno (default 3000);
# start-period cubre el `prisma migrate deploy` + boot antes de contar fallos.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node -e "const p=process.env.PORT||3000;require('http').get('http://localhost:'+p+'/',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]