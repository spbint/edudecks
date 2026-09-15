# Homeschool migration-ledger safety

Before any Homeschool schema release, run the offline filename guard:

```text
npm run check:migrations
```

Then compare the local migration set with the linked Homeschool project without
applying anything:

```text
npx supabase migration list --project-ref jgllsqixpfypunnstinl --linked --output json
```

Compare by the migration source name and SQL purpose, not only by the remote
`version` value. Supabase can record the application timestamp as `version`
while retaining a different source migration name. Any local-only or
production-only entry must be investigated before deployment.

Do not use `supabase db push` while the sets differ. Do not run migration
repair to hide a missing or extra migration. A production-only change should
first be represented by its exact applied SQL under the recorded production
version, and a local-only migration should be classified as required, already
present, obsolete, or requiring product review before it is applied.

This check is intentionally offline and does not require production secrets.
The linked-project comparison is read-only; it must be followed by a manual
diff review before any targeted production operation.
