# syntax=docker/dockerfile:1

# ---- Build: compile the Angular app ------------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false CI=true

COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --network-timeout 600000

COPY . .
RUN yarn build

# ---- Runtime: static files + a dependency-free Node server ------------------------------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4200

COPY --from=build --chown=node:node /app/dist/locry/browser ./dist/locry/browser
COPY --chown=node:node scripts/serve.mjs ./scripts/serve.mjs

USER node
EXPOSE 4200
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:4200/ || exit 1

CMD ["node", "scripts/serve.mjs"]
