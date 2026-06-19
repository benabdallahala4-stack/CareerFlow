# Deploying CareerFlow OS to your VPS

This deploys the whole app (Next.js + PostgreSQL) with Docker Compose. Everything
runs in containers; the only things you provide are two secrets and (optionally) a
domain + reverse proxy for HTTPS.

## 0. Prerequisites (on the VPS, once)

- A Linux VPS (1 vCPU / 1–2 GB RAM is enough to start).
- Docker + Compose:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- The repo on the server:
  ```bash
  git clone <your-repo-url> careerflow && cd careerflow
  ```

## 1. Create the secrets file

Create `.env` next to `docker-compose.prod.yml`:

```bash
cat > .env <<EOF
AUTH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)
INTERNAL_API_SECRET=$(openssl rand -base64 24)
EOF
cat .env   # keep these safe
```

- `AUTH_SECRET` signs session JWTs. If it changes, everyone is logged out.
- `POSTGRES_PASSWORD` is the DB password (used by both containers).

## 2. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

What happens:
- Postgres starts with a persistent volume (`cf_pgdata`).
- The app image builds, then on startup runs `prisma migrate deploy` (creates all
  tables) and starts Next.js on port 3000.
- CV uploads persist in the `cf_uploads` volume.

Check it:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
curl -I http://localhost:3000          # expect 307 -> /login
```

## 3. Create your account

There is no seeded user in production. Open the site and go to **/signup**, or:

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"your-strong-password","name":"You"}'
```

Then sign in at **/login**.

## 4. HTTPS + domain (recommended) — Caddy

Point your domain's A record at the VPS, then run Caddy as an auto-HTTPS reverse
proxy in front of the app. Create `Caddyfile`:

```
your-domain.com {
    reverse_proxy localhost:3000
}
```

Run it:
```bash
docker run -d --name caddy --restart unless-stopped \
  --network host \
  -v $PWD/Caddyfile:/etc/caddy/Caddyfile \
  -v caddy_data:/data \
  caddy:2
```

Caddy obtains and renews a Let's Encrypt certificate automatically. Your app is now
live at `https://your-domain.com`.

> If you use a domain, the app is reached through Caddy, so you can drop the
> `ports: - "3000:3000"` mapping in compose and bind the app only to localhost.

## 5. Updating to a new version

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on startup; they're idempotent and safe to re-run.

## 6. Backups

Back up the Postgres volume regularly:

```bash
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U careerflow careerflow > backup-$(date +%F).sql
```

Restore:
```bash
cat backup-YYYY-MM-DD.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U careerflow careerflow
```

Also back up the `cf_uploads` volume if you rely on stored CV files.

## Notes & limits (current state)

- **AI provider keys are stored unencrypted** in the DB (per-user). Fine for your own
  instance; add encryption-at-rest before onboarding strangers at scale.
- **Automation (n8n) is optional and self-hosted (free).** To enable it, run the separate
  `docker compose -f docker-compose.n8n.yml up -d`, set `CAREERFLOW_APP_URL` to your app URL and
  `INTERNAL_API_SECRET` to match the app, and import the workflows in `n8n/` (see `n8n/README.md`).
  Start with the reminders schedule (no Gmail needed); add the Gmail monitor once you connect a
  Google OAuth app. **Billing is not included yet** — the next phase.
- Set `INTERNAL_API_SECRET` in the app's environment (used by the cron/automation endpoints).
- This is a single-node setup. It scales vertically (bigger VPS) comfortably for
  early usage; horizontal scaling would mean externalizing uploads (e.g. S3) and
  running multiple app containers behind the proxy.
