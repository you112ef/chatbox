FROM node:18 as base

# Prepare dependencies

FROM base as deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --ignore-scripts

# Build app

FROM base as builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY .erb ./.erb
COPY assets ./assets
COPY release/app ./release/app
COPY src ./src
COPY tsconfig.json ./

COPY --from=deps /app/node_modules ./node_modules

RUN npm install && npm run build:renderer

# Release app

FROM caddy:2.6.4-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/release/app/dist/renderer /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
