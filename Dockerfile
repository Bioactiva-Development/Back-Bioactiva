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
COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY src/modules/common/mail/templates ./dist/src/modules/common/mail/templates

EXPOSE 3000

CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]