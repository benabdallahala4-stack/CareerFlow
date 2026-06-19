# CareerFlow OS — production image (multi-stage)
FROM node:22-alpine AS base
WORKDIR /app

# --- deps: install all deps (incl. prisma CLI, needed for migrate deploy) ---
# Uses `npm install` rather than `npm ci` so platform-specific optional deps
# (e.g. native/wasm bindings) resolve correctly inside the Linux image even when
# the lockfile was generated on another OS.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# --- builder: generate Prisma client + build Next.js ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# --- runner: minimal runtime ---
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

# Apply pending migrations, then start. (Migrations are idempotent.)
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
