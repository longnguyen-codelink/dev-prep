FROM node:lts-bookworm-slim
WORKDIR /workspaces/dev-prep
ENV PNPM_HOME=/workspaces/pnpm
RUN corepack enable pnpm
ENV PATH="$PNPM_HOME:$PATH"
COPY pnpm-*.yaml ./
RUN pnpm fetch