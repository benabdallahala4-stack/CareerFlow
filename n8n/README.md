# CareerFlow automation (n8n)

Self-hosted n8n drives the email automation and scheduled reminders. **It is free** — only
n8n Cloud costs money. The app holds all the logic; n8n just triggers and calls the app's
secret-guarded endpoints.

## Start n8n

```bash
# from the repo root
N8N_USER=admin N8N_PASSWORD=secret docker compose -f docker-compose.n8n.yml up -d
```

Open http://localhost:5678 and log in with the basic-auth user/password.

The app it calls is configured by `CAREERFLOW_APP_URL` (default `http://host.docker.internal:3000`
so the container can reach `npm run dev` on your host) and `INTERNAL_API_SECRET` (must match the
app's `.env`).

## Import the workflows

In the n8n UI: **Workflows → Import from File**, then import:

- `n8n/workflows/follow-ups-schedule.json` — runs every 15 min, hits
  `/api/internal/run-notifications` to generate interview reminders + nudges. **No Gmail needed** —
  activate this first to see automation working.
- `n8n/workflows/gmail-email-monitor.json` — watches Gmail and posts each new email to
  `/api/internal/process-email`, which proposes status updates you confirm in the app.

### Gmail setup (for the email monitor)

1. Create a free Google Cloud project, enable the Gmail API, and make an **OAuth 2.0 Client**
   (Desktop or Web). Add the n8n OAuth redirect URL shown in the credential dialog.
2. In n8n, create a **Gmail OAuth2** credential with that client and connect your account.
3. Open `gmail-email-monitor.json`, set the Gmail credential on the trigger node, and replace
   `REPLACE_WITH_YOUR_USER_ID` with your CareerFlow user id (from the `User` table).
4. Activate the workflow.

## Test without Gmail

Simulate an incoming email straight to the app:

```bash
curl -X POST http://localhost:3000/api/internal/process-email \
  -H 'Content-Type: application/json' \
  -H 'x-internal-secret: dev-internal-secret' \
  -d '{"userId":"<your-user-id>","from":"recruiter@acme.com","subject":"Next steps","body":"We would like to schedule a call."}'
```

A suggestion appears on your `/home` ("Suggested updates from your inbox") to apply or dismiss.
