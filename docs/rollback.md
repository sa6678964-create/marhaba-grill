# docs/rollback.md

Rollback playbook (code + deployment)

1) GitHub: revert the last merge
   - Find the last good commit or tag: `git log --oneline`
   - Create a revert PR: `git revert <commit>` and merge

2) Vercel: promote a previous deployment
   - Go to your Vercel project → Deployments → select the last known good deployment → Promote to production
   - Alternatively use the Vercel CLI: `vercel rollback` (check docs)

3) Database rollback (caution: destructive)
   - If migration is reversible and you have a down migration, run it in a transaction.
   - If not reversible:
     - Restore from the most recent backup using `scripts/backup_restore.sh restore <file>`
     - Point the application to the restored DB or restore to a new DB and switch connection strings in environment variables

4) Post-rollback checks
   - Verify application health endpoints
   - Run smoke tests: create order (test mode), admin login, view orders
   - Monitor logs for errors

Emergency contact list and notes:
- Keep Stripe & Supabase dashboard access details with the on-call team
- Keep a copy of the most recent backup stored offsite
