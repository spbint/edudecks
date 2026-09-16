# Supabase security hardening — 16 September 2026

## Scope

This package addresses every security warning in the 16 September export for
production project `jgllsqixpfypunnstinl` without using a broad `supabase db
push`:

- 83 mutable function search paths;
- 63 authenticated-callable `SECURITY DEFINER` functions;
- 53 legacy, internal, or trigger functions with unnecessary direct API
  execution grants;
- 10 always-true write policies;
- 2 anonymous-callable `SECURITY DEFINER` functions; and
- leaked-password protection being disabled.

The database repairs are split into three ordered migrations:

1. `20260916082435_contain_remaining_legacy_rls_exposure.sql`
2. `20260916082517_harden_legacy_security_definer_functions.sql`
3. `20260916082555_pin_public_function_search_paths.sql`

Run `supabase/security/verify_20260916_security_hardening.sql` only after all
three migrations have completed. The verifier is read-only and rolls back its
simulated JWT and role state.

## Expected security result

| Finding | Before | Expected after |
| --- | ---: | ---: |
| Mutable public function search paths | 83 | 0 |
| Anonymous-callable `SECURITY DEFINER` functions | 2 | 0 |
| Authenticated-callable `SECURITY DEFINER` functions | 63 | 16 reviewed exceptions |
| Always-true ordinary API write policies | 10 | 0 |
| RLS disabled in `public` | 0 | 0 |
| API-exposed materialized views | 0 | 0 |

The 16 remaining authenticated `SECURITY DEFINER` warnings are required
Homeschool RPCs or RLS/storage authorization helpers. The verifier treats them
as an exact allowlist and fails if any unreviewed privileged function is added.

## Fail-closed decisions

The legacy intervention and note tables have no checked-in Homeschool runtime
caller and contain learner-sensitive information. Ordinary API access is
removed until a reviewed Campus organisation/class authorization model exists.

The retired `beta_interest` table also fails closed. Any replacement lead form
must use a reviewed, rate-limited server endpoint rather than anonymous direct
table access.

The dormant portfolio-share RPCs become service-role-only. The one-argument
overload is also repaired so it cannot return a password-protected share if the
feature is re-enabled later. The password-aware two-argument overload does not
declare a default password, keeping one-argument calls unambiguous.

## Leaked-password protection

The application now recognises Supabase's stable `weak_password` error and
shows safe guidance on public sign-up/sign-in, password reset, and Founder
password screens.

Do not enable the production Auth setting before those UI changes are deployed.
After the deployment is healthy, enable **Auth → Providers → Email → Prevent
use of leaked passwords**, then test:

1. weak and strong public account creation;
2. weak and strong password reset;
3. Founder password update;
4. existing password sign-in;
5. OTP/magic-link sign-in; and
6. session refresh.

Existing users are not automatically locked out solely because their current
password falls short of strengthened requirements. Supabase returns warning
information with a successful password sign-in; new account creation and
password-change attempts are the operations that reject an unacceptable new
password. Confirm that behavior with an acceptance account before rollout.

Reference: [Supabase password security](https://supabase.com/docs/guides/auth/password-security).

## Safe deployment sequence

1. Reconfirm production project reference and application bindings.
2. Apply the three migrations in order to an approved isolated environment.
3. Run the complete read-only verifier and Security Advisor.
4. Exercise authenticated family flows and service-role maintenance operations.
5. Review any permission errors before production approval.
6. Apply only these three migrations to production, one at a time, inside their
   existing short transactions.
7. Do not use `supabase db push`; the local and remote migration ledgers contain
   known historical divergence and an unrelated local migration remains pending.
8. Reconcile each local filename with the exact version recorded remotely before
   committing the final files.
9. Run the verifier, Security Advisor, authenticated smoke tests, database logs,
   and Vercel/Sentry monitoring.
10. Deploy the password UI changes, then separately enable leaked-password
    protection and repeat the authentication checks above.

If a database statement reaches the five-second lock timeout or 60-second
statement timeout, stop and investigate. Do not split a failed migration into
unreviewed autocommit statements.

## Performance findings

Performance lint findings are not treated as a breach or emergency. Address
them in a separate workload-informed pass:

1. re-run Performance Advisor after the security migrations;
2. optimize active RLS expressions with `(select auth.uid())` where safe;
3. remove only proven duplicate policies and exact duplicate indexes;
4. add foreign-key indexes where actual queries need them; and
5. observe a representative workload before removing an index reported unused.

Do not bulk-drop indexes or bulk-create every suggested foreign-key index. Both
actions can increase production risk and write cost without evidence of benefit.

## Recovery principle

The normal recovery path is a reviewed forward fix. Restoring broad anonymous or
cross-tenant grants would recreate the vulnerability and is not an acceptable
routine rollback.
