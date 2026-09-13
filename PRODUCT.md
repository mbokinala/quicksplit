# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Friends sharing expenses on trips and similar occasional group activities. One person can start tracking expenses before everyone joins; other participants can join later and see who owes whom.

Recurring household expenses are outside the confirmed product focus.

## Product Purpose

QuickSplit helps groups track shared expenses, divide costs, record repayments, and understand outstanding balances. Success means the group can account for shared spending and see who still needs to repay whom.

## Positioning

The central mechanism is tracking first and joining later: an organizer creates named member slots, includes those people in expenses and payments, and shares an invite link. Participants can claim their existing slot when they sign in, retaining its expense history.

This mechanism is confirmed product behavior. Competitive differentiation and broader market positioning remain undecided.

## Operating Context

1. Sign in with a phone verification code and set a display name.
2. Create a group for a trip or another shared activity, choose its currency, and add participants by name.
3. Add expenses with a payer and either equal shares among selected participants or custom amounts.
4. Share the group invite link. Participants sign in and claim their name, or join under a new name.
5. Review expenses, recorded payments, and balances; record repayments as they happen.

The main routes are `/home` for the user's groups, `/groups/[groupId]` for a group, and `/invite/[code]` for joining. Expense and payment forms live under their group.

## Capabilities and Constraints

The following describes the current implementation. The user requested that current behavior be recorded while longer-term strategy stays undecided.

- Preserve the existing Next.js, shadcn, Convex, and Convex Auth stack. Follow `CONVEX_RULES.mdc` for Convex work.
- Sign-in uses SMS verification codes. The current form accepts US phone numbers and applies the `+1` country code.
- Named members can participate in expense and payment records before they have an account. An account can claim an existing member slot through the invite flow.
- Each group has one currency, defaulting to USD. The current implementation stores integer cents and formats amounts with the `en-US` locale; currency conversion and currencies with different minor-unit conventions are not established capabilities.
- Expenses support equal splits across all or selected members, plus custom positive amounts that must sum to the expense total. Equal splits distribute remaining cents so the shares preserve the total.
- Members can add and edit expenses, record and edit payments, and view shared group data through reactive Convex queries.
- Payments record who paid whom, an amount, and an optional note. The app currently records repayments made elsewhere; it does not initiate money transfers.
- Balances account for expense shares and recorded payments, netting reciprocal debts between each pair of members. The implementation does not establish a group-wide minimum-transfer settlement algorithm.
- Members can add participants and change their own group display name. Only the group creator can delete the group and its associated records.
- The interface and current product copy are in English.

## Brand Commitments

The confirmed product name is **QuickSplit**. Use it in future product work. `README.md` and the repository folder retain the older EasySplit name; those references do not override the confirmed name.

No additional binding voice, aesthetic, or identity commitments were established during initialization.

## Evidence on Hand

- `PLAN.md` records the original product goals and workflows. It also contains planned and optional behavior; verify implementation before treating those items as available features.
- `app/page.tsx` contains the current landing-page claims. Its “Get started free” copy is existing copy, not confirmation of a permanent pricing policy.
- `app/`, `components/sign-in.tsx`, and `convex/` provide implementation evidence for the capabilities above.
- `logo.png` and `public/favicon.ico` are existing asset files. No additional asset or usage commitments were confirmed.
- The reviewed project contains no substantiated customer testimonials, adoption metrics, or case studies. Do not invent them.

## Product Principles

- Let one person start tracking without waiting for every participant to sign up.
- Keep trips and occasional shared activities as the core use case.
- Preserve each participant's financial history when they join an existing group.
- Keep split totals exact and make the direction of each outstanding balance clear.

## Open Decisions

Pricing, competitive positioning, long-term authentication and geographic scope, localization, and product-specific accessibility requirements remain undecided. Current implementation choices are context, not permanent strategic commitments.
