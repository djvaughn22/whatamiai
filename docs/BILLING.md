# Billing plan (not built, not live)

Nothing in the app takes payment. The Pricing page states that paid plans are not open. This file is the plan for when the owner authorizes billing.

## Plans (owner's hypothesis, 2026-11-15)

| Plan | Price | What it adds |
|---|---|---|
| Free | $0 | Everything that works today (tree, evidence, research plans, newspaper search, timeline, map, stories, book, GEDCOM, backups) |
| Discovery Plus | $6.99/mo or $59/yr | AI handwriting transcription, AI research help with monthly credits, source comparison, more story and book formats |
| Family Archive | $12.99/mo or $109/yr | Shared family workspaces, account sync, more storage, printed books |

Paid tiers only make sense once a paid feature exists that costs money to run (AI, storage, printing). Build at least one before turning on checkout.

## Blockers needing the owner

1. Stripe account for Open Mirror LLC (business verification, bank account). Claude must not create accounts or enter payment or bank details.
2. Accounts and a database (see ARCHITECTURE.md): entitlements need a user to attach to.
3. Terms of service, refund and cancellation policy, privacy policy.
4. An AI provider key and a monthly cost cap if AI features are sold.
5. Confirm the employment-conflict question for selling a consumer genealogy product.

## Implementation checklist (when authorized)

- Stripe Checkout (hosted) for subscriptions; Customer Portal for cancel/upgrade/payment method. No card data touches WhatAmIAI.
- Webhook endpoint (`/api/stripe/webhook`) verifying the `Stripe-Signature` header with the endpoint secret; idempotent handling keyed by event id.
- Handle `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.
- `entitlements` table: user, plan, status, current_period_end, credits_remaining; the app reads entitlements, never Stripe directly.
- Credits: monthly reset on `invoice.paid`; hard cap per request; show remaining credits.
- Cancellation keeps access to the end of the paid period, then drops to Free with **no data loss and full export**.
- Test end to end in Stripe test mode on a preview deployment with Stripe's published test cards before any live key exists.
- Secrets only in Vercel environment variables, never in the repo.
