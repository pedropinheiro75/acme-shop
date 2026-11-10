# Project knowledge

Status: **draft**

## Compose

Files: docker-compose.yml

| service | image | db | ports | healthcheck |
|---|---|---|---|---|
| adminer | adminer:4 | - | 8081:8080 | false |
| api | (build) | - | 3000:3000 | false |
| mailpit | axllent/mailpit:v1.21 | - | 8025:8025, 1025:1025 | false |
| postgres | postgres:17-alpine | postgres 17 | 5432:5432 | true |
| redis | redis:7-alpine | redis 7 | 6379:6379 | false |
| web | nginx:1.27-alpine | - | 8080:80 | false |
| worker | (build) | - |  | false |

## What prepare would refuse or rewrite

- [rewrite] volumes.pgdata: volumes.pgdata: renamed to sf-learn_pgdata so concurrent stacks don't collide
- [rewrite] networks.default: networks.default: renamed to sf-learn_default so concurrent stacks don't collide
- [rewrite] services.worker: services.worker: image renamed to sf-learn-worker:dev for the isolated build
- [rewrite] services.adminer.ports[0]: services.adminer: published port stripped so Docker assigns a random host port
- [rewrite] services.api: services.api: image renamed to sf-learn-api:dev for the isolated build
- [rewrite] services.api.ports[0]: services.api: published port stripped so Docker assigns a random host port
- [rewrite] services.mailpit.ports[0]: services.mailpit: published port stripped so Docker assigns a random host port
- [rewrite] services.mailpit.ports[1]: services.mailpit: published port stripped so Docker assigns a random host port
- [rewrite] services.postgres.ports[0]: services.postgres: published port stripped so Docker assigns a random host port
- [rewrite] services.redis.ports[0]: services.redis: published port stripped so Docker assigns a random host port
- [rewrite] services.web.ports[0]: services.web: published port stripped so Docker assigns a random host port

## Startup plan

Status: recorded

- prepare · prepare · -f docker-compose.yml
- up · compose-up · 
- migrate · exec · api: node src/migrate.js (once schema)
- seed · exec · api: node src/seed.js (once data)

## Entry and links

- App: web:80
- Mailpit: mailpit:8025
- Adminer: adminer:8080
- Stack JSON: /api/stack (on the entry)

## How code changes reach the app

- api: rebuild
- worker: rebuild
- web: hot nginx serves web/public from a bind mount: edit and refresh

## Secrets (names only)

- STRIPE_SECRET_KEY: Stripe test key (sk_test_...), used by api and worker
- JWT_SECRET: Random string that signs session tokens

## Answers

- Q: Where do migrations and seed run?
  A: In the api container: node src/migrate.js on every start (idempotent), node src/seed.js only when the data volume is new.

