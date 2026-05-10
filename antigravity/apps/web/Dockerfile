# Stage 1: Build
FROM node:22-alpine AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Fix lỗi có thể xảy ra khi build native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy lockfile và config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy shared packages
COPY packages/types ./packages/types

# Copy ứng dụng web
COPY apps/web ./apps/web

# Đảm bảo thư mục public tồn tại để tránh lỗi COPY ở stage sau
RUN mkdir -p apps/web/public

# Cài đặt dependencies
RUN pnpm install --frozen-lockfile

# Build ứng dụng. Do đã cấu hình `output: 'standalone'`, 
# Next.js sẽ tạo một thư mục .next/standalone chứa đầy đủ server thu gọn
WORKDIR /app/apps/web
RUN pnpm build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
# Khuyến nghị của Next.js: Vô hiệu hoá telemetry
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy thư mục public (Next.js standalone không tự copy public files)
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set quyền thư mục .next
RUN mkdir -p /app/apps/web/.next && chown nextjs:nodejs /app/apps/web/.next

# Copy server thu gọn từ standalone build
# Lưu ý: standalone tự giải quyết các packages trong workspace nếu cấu hình đúng
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# Biến HOSTNAME rất quan trọng cho Next.js standalone chạy trong docker
ENV HOSTNAME "0.0.0.0"

# Lệnh khởi chạy server (thư mục gốc tuỳ thuộc vào cách Next tạo standalone trong monorepo)
# Thông thường nó sẽ map theo cấu trúc thư mục của monorepo.
CMD ["node", "apps/web/server.js"]
