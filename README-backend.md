# Backend README & Deployment Instructions

This backend scaffolds serverless endpoints, Supabase migrations, and helper scripts to run the Marhaba ordering backend. It is designed for use with Vercel serverless functions and Supabase Postgres.

Files added:
- api/create-order.js        → POST endpoint to create orders and initiate Stripe PaymentIntents
- api/webhooks-stripe.js    → Stripe webhook handler with signature verification & idempotency logging
- api/admin-login.js        → Simple admin login returning JWT (example)
- migrations/0001_init.sql  → Initial DB schema for Supabase/Postgres
- .env.example              → Environment variable names required
- scripts/backup_restore.sh → Example backup & restore commands
- docs/rollback.md          → Rollback and emergency playbook

Important security notes:
- Never commit SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, or STRIPE_WEBHOOK_SECRET to GitHub.
- Store secrets in Vercel Environment Variables or your deployment secret manager.

Running migrations (recommended via supabase CLI):
1. Install supabase CLI and authenticate.
2. Run: supabase db remote set "<your-remote-db-connection-string>"
3. Run the SQL file with psql or the supabase SQL editor:
   psql "$DATABASE_URL" -f migrations/0001_init.sql

Local testing (without sharing secrets):
- You may run the API locally with node and set env vars via a .env file (use .env.example for guidance). Use the Stripe CLI to forward webhooks to your local server for testing.

Stripe Webhook testing:
- Use `stripe listen --forward-to localhost:3000/api/webhooks-stripe` and then run test events

Next steps I will implement after you verify this PR:
- Harden input validation (zod), add transaction-safe DB writes (pg) for atomic order creation, implement admin RBAC, CI pipeline, and full E2E tests in Stripe TEST MODE.

