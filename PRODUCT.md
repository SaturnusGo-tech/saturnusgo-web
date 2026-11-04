# Falcon

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

QA engineers, QA managers and company administrators use Falcon to organize test coverage, prepare releases, execute tests and inspect actual results. The owner is adding a separate personal account for one person to try the product for seven days.

## Product Purpose

Reduce the effort needed to maintain test cases, folders, shared steps and suites, prepare runs, record evidence and understand release quality. Integrations, API testing and a scoped Codex connection support this work.

## Operating Context

The hosted web application is the main product. Electron packages the hosted application for macOS Apple Silicon, macOS Intel and Windows. Desktop company sessions are isolated. Company administrators manage members and organization access separately from ordinary QA project settings.

## Capabilities and Constraints

- Company invitations, existing memberships, tenant isolation, MFA and immutable execution history must survive authentication changes.
- Backend business rules and versioned OpenAPI are authoritative. UI must not invent trial eligibility, access rights or lifecycle transitions.
- Existing implementation uses Next.js/React/TypeScript, Fastify and PostgreSQL. Follow vertical feature modules and existing architecture checks.
- Remote desktop content has no Node access or privileged preload bridge.
- New sign-in will offer Google, email and company SAML SSO before showing the relevant input. Public signup must confirm email and provide seven days of personal access.
- Billing is not implemented in this iteration. Upgrade UI must not collect payment information, invent prices or claim a working checkout.
- Passkey, SCIM and IdP-initiated SAML are outside the current authentication request.
- Trial expiry behavior and mandatory SSO recovery are proposed in the authentication design and remain subject to owner approval.

## Brand Commitments

Use Falcon's existing linear falcon mark and the product identity established with the owner. The owner explicitly prefers the familiar, restrained interaction patterns and visual precision of ChatGPT and Linear, compact controls, rounded inputs and useful semantic color. Avoid oversized blocks, duplicated actions, square nested input backgrounds and technical copy where it does not help the user.

For the current authentication surface, the supplied Linear login/signup screenshots are the visual authority: centered method selection, a quiet dark canvas and a narrow stack of controls. This is a pinned reference, not an invitation to propose unrelated visual worlds.

## Evidence on Hand

- Existing production Umbrella workspace and local isolated UI preview.
- Existing company access screens, account models and generated API transport.
- Owner-supplied login, email, signup and trial-notice references dated November 4, 2026.
- A written SAML architecture brief supplied by the owner. The referenced ZIP is not attached and must not be treated as implemented or verified code.

## Product Principles

1. Make the next QA action clear with minimal navigation and copy.
2. Preserve one coherent identity across repository, settings, integrations and desktop.
3. Keep company authority and personal access explicit; never grant membership by inference.
4. Keep server state authoritative and expose honest loading, error and unavailable states.
5. Explain significant behavior changes before implementation; the owner handles manual UI acceptance for this authentication iteration.
