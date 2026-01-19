FROM node:lts-bookworm-slim

# Install dependencies
COPY .devcontainer/env/devcontainer.env /tmp/devcontainer.env

RUN --mount=target=/var/lib/apt/lists,type=cache,sharing=locked \
    --mount=target=/var/cache/apt,type=cache,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get -y --no-install-recommends install \
        default-jdk \
        xdg-utils \
        wget \
        unzip \
        libaio1 \
        alien \
        rpm

# Install Oracle Instant Client for SQL*Plus
WORKDIR /workspaces/oracle
RUN . /tmp/devcontainer.env \
    && wget "${ORACLE_BASIC_RPM_URL}" \
    && wget "${ORACLE_SQLPLUS_RPM_URL}" \
    && alien -i "${ORACLE_BASIC_RPM_ARTIFACT}" \
    && alien -i "${ORACLE_SQLPLUS_RPM_ARTIFACT}" \
    && rm -f "${ORACLE_BASIC_RPM_ARTIFACT}" "${ORACLE_SQLPLUS_RPM_ARTIFACT}" \
    && rm -f /tmp/devcontainer.env

ARG LD_LIBRARY_PATH=""
ENV LD_LIBRARY_PATH=/usr/lib/oracle/23/client64/lib:${LD_LIBRARY_PATH}
ENV PATH=/usr/lib/oracle/23/client64/bin:$PATH

# Setup PNPM
WORKDIR /workspaces/dev-prep
ENV PNPM_HOME=/workspaces/pnpm
RUN corepack enable pnpm
ENV PATH="$PNPM_HOME:$PATH"
COPY pnpm-*.yaml ./
RUN pnpm fetch