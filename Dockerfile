FROM node:22-slim AS base
RUN apt update
RUN apt install -y unzip curl
RUN curl -fsSL https://bun.sh/install | bash
ENV BUN_INSTALL="/root/.bun"
ENV PATH="$BUN_INSTALL/bin:$PATH"
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .
COPY packages ./packages

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM oven/bun:1
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/packages/server/out/ .
COPY --from=build /app/packages/web/dist/ ./public/

ENTRYPOINT ["bun", "run", "index.js"]