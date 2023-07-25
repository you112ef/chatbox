FROM caddy:2.6.4-alpine

COPY ./release/app/dist/renderer /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
