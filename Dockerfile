# TensorPath (tensorpath.in) production image (7 Nov 2026: moved off Vercel to Surge's own server).
# Built and run on the server by deploy/server-deploy.sh. Settings come from the server's
# .env.production (never committed). Tables are synced with `prisma db push` when the
# container starts, as the Vercel build did.
FROM node:24-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

FROM node:24-bookworm-slim AS run
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /app ./
RUN chown -R node:node /app/.next
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s CMD curl -fs -o /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["sh", "-c", "npx prisma db push --skip-generate && exec npx next start -p 3000"]
