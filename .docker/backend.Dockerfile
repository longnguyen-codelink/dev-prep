FROM node:lts-bookworm-slim AS base
RUN npm i -g pnpm
COPY pnpm-* .
RUN pnpm fetch

FROM base AS build
WORKDIR /app
COPY pnpm-* .
COPY apps/backend apps/backend
RUN pnpm --filter backend deploy --offline --prod --legacy /modules/backend

FROM node:lts-bookworm-slim AS runtime
WORKDIR /app
COPY --from=build /modules/backend .
CMD ["node", "src/index.js"]