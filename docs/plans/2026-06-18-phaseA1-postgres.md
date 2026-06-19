# CareerFlow OS — Phase A1: SQLite → Postgres

**Goal:** Move the database from SQLite to PostgreSQL (local via Docker, prod on the VPS) so multi-user concurrency works. Free locally.

**Architecture:** Prisma datasource switches to `postgresql`. A tiny `docker-compose.yml` runs Postgres 16 locally. Fresh init migration (dev data is throwaway). All 31 existing tests + build are the regression net.

**Env:** `wsl.exe bash -lc "cd /home/ala/gitlab/CareerFlow && <cmd>"`. Docker 28 + compose available.

---

### Task 1: Local Postgres via Docker

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: careerflow
      POSTGRES_PASSWORD: careerflow
      POSTGRES_DB: careerflow
    ports:
      - "5433:5432"
    volumes:
      - cf_pgdata:/var/lib/postgresql/data

volumes:
  cf_pgdata:
```

(Port 5433 on host to avoid clashing with any existing local Postgres on 5432.)

- [ ] **Step 2: Start it**

```bash
docker compose up -d
docker compose ps
```

Expected: `db` container running.

---

### Task 2: Point Prisma at Postgres

- [ ] **Step 1: Update `.env`**

```
DATABASE_URL="postgresql://careerflow:careerflow@localhost:5433/careerflow?schema=public"
```

- [ ] **Step 2: Edit `prisma/schema.prisma` datasource**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 3: Remove the old SQLite migration + db file**

```bash
rm -rf prisma/migrations
rm -f prisma/dev.db
```

- [ ] **Step 4: Create the fresh Postgres init migration**

```bash
npx prisma migrate dev --name init_postgres
```

Expected: creates `prisma/migrations/<ts>_init_postgres`, applies it, generates client.

- [ ] **Step 5: Seed**

```bash
npx prisma db seed
```

Expected: "Seed complete."

---

### Task 3: Regression

- [ ] **Step 1: Tests** `npm test` — 31 pass (now against Postgres).
- [ ] **Step 2: Build** `npm run build` — clean.
- [ ] **Step 3: Update `.gitignore`** — add `# postgres is in docker; no local db file` note; ensure `/prisma/*.db` lines can stay (harmless). Add nothing else required.
- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(phaseA): migrate SQLite -> PostgreSQL (local docker)"
```

---

## Notes
- Prod uses the same schema; only `DATABASE_URL` differs (set on the VPS).
- `String` fields map to Postgres `text` (no length limits) — fine for CV content/descriptions.
- Tests now require the Postgres container up (`docker compose up -d`).
