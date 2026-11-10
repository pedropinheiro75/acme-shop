# Acme Shop

A small storefront for [stackfork](https://github.com/pedropinheiro75/stackfork) demos. Everything runs in Docker Compose.

| Service | What it does |
|---|---|
| `web` | nginx serves the storefront and proxies `/api` to the api |
| `api` | Node REST API. Reads `STRIPE_SECRET_KEY` and `JWT_SECRET` from Compose secrets |
| `worker` | Takes orders from Redis, "charges" them with the Stripe key, emails a receipt |
| `postgres` | Products, customers and orders |
| `redis` | Order queue |
| `mailpit` | Catches every email. One inbox per environment |
| `adminer` | Database browser |

The startup plan in `.stackfork/` runs the migrations (`api/migrations/`) on every start and the seed only when the database is new.

## Start it

You need Docker and stackfork.

1. Store the two secrets in your keychain (run once per machine):

   ```sh
   stackfork secret set acme-stripe
   stackfork secret set acme-jwt
   stackfork secret map . STRIPE_SECRET_KEY=keychain:acme-stripe
   stackfork secret map . JWT_SECRET=keychain:acme-jwt
   ```

   Any value works. `stackfork secret ls` shows the status of each one. The app shows only a fingerprint of each secret, never the value.

2. Start the environment:

   ```sh
   stackfork start-env
   stackfork urls
   ```

3. Open the App URL and buy something. The order goes to `paid` and a receipt shows up in Mailpit.

## Run a second branch next to it

```sh
git fetch origin feature/black-friday
stackfork worktree add . feature/black-friday --from origin/feature/black-friday
cd .worktrees/feature-black-friday
stackfork start-env
```

The branch gets its own ports, database, Redis, inbox and `.localhost` URL. `/api/stack` shows which database cluster and migrations each copy uses.
