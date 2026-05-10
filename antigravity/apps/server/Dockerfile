# Stage 1: Build
FROM node:22-alpine AS builder

# Thiết lập pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root configurations (nếu có pnpm-workspace.yaml, package.json)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy packages chia sẻ
COPY packages/types ./packages/types

# Copy source server
COPY apps/server ./apps/server

# Cài đặt dependencies (frozen-lockfile để build chuẩn xác)
RUN pnpm install --frozen-lockfile

# Generate Prisma Client (quan trọng trước khi build server)
WORKDIR /app/apps/server
RUN pnpm prisma generate

# Build server -> kết quả ở apps/server/dist
RUN pnpm build

# Chạy lệnh prune để xoá devDependencies (tuỳ chọn, nhưng ta dùng cách copy qua runner sẽ nhẹ hơn)

# Stage 2: Runner
FROM node:22-alpine AS runner

ENV NODE_ENV production

WORKDIR /app

# Non-root user để tăng bảo mật
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Cài đặt openssl cho Prisma nếu cần thiết trên Alpine
RUN apk add --no-cache openssl

# Set owner
RUN chown nestjs:nodejs /app

USER nestjs

# Chỉ copy những thứ cần thiết từ builder
# 1. Package files
COPY --chown=nestjs:nodejs --from=builder /app/package.json ./
COPY --chown=nestjs:nodejs --from=builder /app/pnpm-workspace.yaml ./
# 2. Shared packages (nếu cần lúc runtime)
COPY --chown=nestjs:nodejs --from=builder /app/packages/types ./packages/types
# 3. Server node_modules & dist & schema
COPY --chown=nestjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --chown=nestjs:nodejs --from=builder /app/apps/server/dist ./apps/server/dist
COPY --chown=nestjs:nodejs --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --chown=nestjs:nodejs --from=builder /app/apps/server/prisma.config.ts ./prisma.config.ts
COPY --chown=nestjs:nodejs --from=builder /app/apps/server/package.json ./apps/server/package.json

EXPOSE 4000

# Healthcheck để docker-compose / orchestrator biết trạng thái
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

WORKDIR /app/apps/server

CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node dist/src/main"]
