# Restoring the earlier WhatAmIAI (reflection tools)

The self-reflection version that was live on whatamiai.com until the family-history rebuild is preserved three ways:

| Copy | Where |
|---|---|
| Git tag (annotated) | `whatamiai-legacy-2026-11-15` → commit `7814abf` (Vercel production deployment of 2026-11-15 06:20 UTC) |
| Git branch | `archive/legacy-whatamiai` → the same commit |
| Offline bundle | Owner's machine: `~/WatchedNotWatched/whatamiai-rebuild-2026-11-15/legacy-backup/whatamiai-all-refs-2026-11-15.bundle` (sha256 `fa3ed034abb95857be91d3e60a903fde22b8d408b24b1166a7c551cb56fba2b2`) |

It needs no environment variables and has no server data. Visitors' saved reflections live in their own browsers under the keys listed in `app/lib/legacy.ts`; the rebuild never touches them except on `/earlier` when a visitor asks.

## Run it locally

```bash
git clone https://github.com/djvaughn22/whatamiai.git whatamiai-legacy
cd whatamiai-legacy
git checkout whatamiai-legacy-2026-11-15
npm ci
npm test
npm run build
npx next start -p 3917
```

Verified 2026-11-15: 305 tests pass, typecheck clean, build clean, pages served.

From the offline bundle instead of GitHub: `git clone <bundle path> whatamiai-legacy`, then the same steps.

## Put it back in production

1. Make `main` point at the legacy commit with a new commit (keeps history):
   ```bash
   git checkout main
   git revert --no-commit <first rebuild merge commit>..HEAD
   git commit -m "Restore the reflection tools"
   git push origin main
   ```
   Or, if the rebuild was merged as one merge commit, `git revert -m 1 <merge sha>`.
2. Vercel deploys `main` automatically. Or promote the archived production deployment from the Vercel dashboard (Deployments → the 2026-11-15 production deployment → Promote) for an instant switch with no build.
3. Remove the `/mirror`, `/situation`, … redirects only if the rebuild is gone entirely (they live in the rebuild's `next.config.ts`).
