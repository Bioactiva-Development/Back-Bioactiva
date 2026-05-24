FROM node:22-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable
RUN corepack prepare pnpm@10.32.1 --activate
RUN apt-get update -y && apt-get install -y openssl netcat-openbsd && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

FROM deps AS builder
COPY prisma ./prisma
COPY prisma.config.ts nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm prisma generate
RUN pnpm run build

FROM base AS runner
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY prisma.config.ts ./
EXPOSE 3000
CMD ["node", "-r", "tsconfig-paths/register", "dist/src/main"]