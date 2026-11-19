FROM node:22-bookworm-slim AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM node:22-bookworm-slim AS backend-builder

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app/backend

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system app \
    && adduser --system --ingroup app app \
    && mkdir -p /app/backend/uploads \
    && chown -R app:app /app

COPY --from=backend-builder --chown=app:app /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=app:app /app/backend/package.json ./package.json
COPY --from=backend-builder --chown=app:app /app/backend/prisma ./prisma
COPY --from=backend-builder --chown=app:app /app/backend/dist ./dist
COPY --from=frontend-builder --chown=app:app /app/frontend/dist /app/frontend/dist

ENV NODE_ENV=production
ENV PORT=3000
ENV UPLOAD_DIR=uploads

USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]