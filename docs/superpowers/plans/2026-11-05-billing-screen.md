# Falcon plan and billing screen

Extend the established settings surface. The account menu shows a clickable plan in place of the membership role and offers Plan and billing. All active members can read the plan; only administrators manage subscription and invoices.

1. Add a safe, tenant-authorized billing summary projection and generated contract types. Preserve the existing rule that mock billing is disabled in production.
2. Implement the client port and state with cancellation, stale-response handling, idempotent command retry and subscription version checks. Provide a clearly labeled isolated UI-preview adapter.
3. Add settings navigation and the account-menu plan entry, preserving workspace context, existing history and native/web navigation.
4. Render current plan/status, occupied seats, three monthly plans, checkout confirmation, renewal/cancel/resume/retry and invoice history. Show catalog prices excluding tax; show recorded tax and total on invoices. A real provider's hosted checkout will quote applicable tax before any live charge. No card collection in Falcon.
5. Keep existing companies without a subscription unchanged. Show the lack of an active subscription honestly, explain that current access remains, and let administrators explicitly choose a plan. Umbrella with eight occupied seats requires Enterprise if subscribing; no automatic assignment or charge.

Review focus: non-admin financial access, unknown versus unsubscribed state, over-capacity plan choices, failure/retry duplication, workspace switches, test-mode labeling and disabled-provider behavior.

Validation: focused backend summary and client state/navigation/render tests, generated-contract synchronization, architecture checks, type checking and production frontend build. The owner performs manual UI acceptance.

Implemented review corrections: recover pending checkout from the admin read after a remount; allow a new checkout after a canceled subscription even when its old renewal-off flag remains; retry a failed first invoice page independently of newly inserted mutation invoices. Receipt replays refresh authoritative data to avoid overwriting a newer subscription.
