# Radiant billing implementation

Approved direction: a single focused offer using the Radiant reference, Falcon's existing color tokens and line logo, and separate generated artwork for each plan. The page supports English and Russian, native and browser surfaces, and both themes.

1. Render Individual ($11 monthly plus tax) for a personal account without a subscription. Provide a discreet alternative to select Startup ($59 monthly plus tax, five seats) directly. Recommend Startup to an Individual subscriber; recommend a contact-only Enterprise offer to Startup and existing companies. No public Enterprise price or checkout.
2. Make the server return allowed checkout and plan-change actions. Reject Enterprise purchase, including previously opened checkouts. Preserve existing unsubscribed companies and paid access after renewal cancellation. Payment remains explicitly simulated; Falcon collects no card data.
3. Collect a successful Startup payment before promoting the existing personal workspace. Keep the workspace, owner, projects, subscription history and identity. Grant the owner team administration, five seats and the established invitation/domain-provisioning flow. Recheck live authorization on every team operation. Fail safely before payment when team hosting is unavailable.
4. Synchronize generated contracts and isolated preview behavior. Refresh the billing policy and administration navigation after confirmed changes. Cover direct Startup purchase, immediate Individual upgrade, decline, duplicate confirmation, Enterprise rejection and legacy preservation with focused tests.
5. Run type checks, architecture checks, builds and focused tests. Inspect one rendered example for cropping/layout; the owner performs manual UI acceptance.

Visual assets and original generation prompts: public/falcon/billing/provenance.json. UI pricing is explanatory; future provider-hosted checkout must quote applicable taxes before any real charge.

## Confirmed lifecycle details

- Individual to Startup charges the server-quoted difference for the remaining period, keeping the renewal date. Checkout confirmation revalidates the subscription version; an obsolete quote can be replaced without waiting for its original expiry. A decline does not grant seats or administration.
- New personal teams keep their original owner and personal sign-in. Their administration screen supports invitations and member management. Ownership transfer remains unavailable for this identity type until a separate identity migration flow exists; managed-company ownership transfer is unchanged.
- Existing negotiated Enterprise subscriptions renew using their saved terms. They do not inherit an obsolete public Enterprise price or seat limit. The self-serve catalog contains only Individual and Startup.
- The mock provider runs only in isolated development/test. Production billing remains disabled until a real provider is approved and connected. Publishing frontend code does not activate charges or create a production subscription.
- Billing artwork ships under the existing public `/falcon/` asset route. The offer fills the product canvas and has no separate settings header, invoice section or account-status banners.

## Disabled-payment production release

- `billingPaymentsAvailable` is a fixed false flag. `BillingFeature` renders a public, read-only catalog without mounting subscription, checkout or confirmation services. Individual, Startup and Enterprise conversion buttons are disabled, without click handlers or links.
- The footer reads “Payments are coming soon” / “Оплата скоро станет доступна”. Plan switching is available for browsing only. Account menus show “View plans” and do not request billing summaries; existing company administration links remain intact.
- A read-only production audit on 2026-11-05 confirmed that primary API, managed API and notifications run in production with no billing provider configured. The public billing catalog endpoint returns 404 on both API and application origins. No backend deployment, provider activation or schema 0091 migration belongs to this frontend release.

## Verification

- The coming-soon suite passes 62 billing tests, including component renders with poisoned HTTP/fetch that prove no billing requests occur. Four focused personal-administration regression tests and type checking pass. Deployment tests cover required artwork and reject incomplete assets.
- Generated OpenAPI matches the backend artifact. The final Impeccable detector reports no findings. Its marketing-only type/radius rules have narrow recorded exceptions for the two authenticated billing stylesheets; other design checks remain enabled.
- The local rendered page confirms the disabled Individual button and English footer subtitle. The owner performs detailed UI acceptance; browser automation became unavailable during the final layout refresh. The production export and deployment guards run during publication.
- Real provider activation is excluded. Schema 0091 requires the separate compatibility/backup rollout described by the backend runbook.
