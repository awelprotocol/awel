# syntax=docker/dockerfile:1

# ---- build stage ---------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install deps with a clean, reproducible lockfile install.
COPY package.json package-lock.json* ./
RUN npm ci

# Compile the TypeScript SDK + CLI.
COPY tsconfig.json ./
COPY src ./src
COPY cli ./cli
RUN npm run build && npm prune --omit=dev

# ---- runtime stage -------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as the unprivileged node user shipped in the base image.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node
ENTRYPOINT ["node", "dist/cli/awel.js"]
CMD ["--help"]
