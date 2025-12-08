FROM node:lts-bookworm-slim
WORKDIR /workspaces/dev-prep
ENV PNPM_HOME=/workspaces/pnpm

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get -y --no-install-recommends install default-jdk \
        xdg-utils

RUN corepack enable pnpm
ENV PATH="$PNPM_HOME:$PATH"
COPY pnpm-*.yaml ./
RUN pnpm fetch