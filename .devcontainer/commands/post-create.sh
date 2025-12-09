git config --global --add safe.directory /workspaces/dev-prep
# pnpm setup
pnpm config set store-dir /workspaces/pnpm/.pnpm-store
pnpm install
# Global packages
pnpm add -g @nestjs/cli prettier typescript