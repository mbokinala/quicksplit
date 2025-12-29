# EasySplit Plan

## Product goals
- Let users create groups, add members (even before they join), add shared expenses, record payments, and see who owes who.
- Support phone-number sign up (Convex Auth).
- Make it easy to claim a pre-created member slot when joining via invite link.

## Core user flow (target)
1. John signs up with phone number.
2. John creates a group, adds Alice/Bob/Charlie as unclaimed members, and gets an invite link.
3. John adds expenses (some split among all, some among a subset), and records any payments.
4. Alice joins via invite link, signs up, sees unclaimed list, clicks her name, and is linked to that member.
5. Alice sees her expenses and balances. Bob and Charlie follow the same flow later.

## Data model (Convex tables)
Use integer cents for all money fields to avoid floating errors.

### users (Convex Auth)
- Managed by Convex Auth (phone provider). Store profile data in a separate table.

### profiles
- userId: Id<"users">
- displayName: string
- phoneLast4: optional string (derived from auth if needed)
- createdAt: number
Indexes:
- by_userId

### groups
- name: string
- createdBy: Id<"users">
- inviteCode: string (short, human-friendly)
- currency: string (default "USD")
- createdAt: number
Indexes:
- by_createdBy
- by_inviteCode

### groupMembers
- groupId: Id<"groups">
- displayName: string
- userId: optional Id<"users"> (null until claimed)
- invitedBy: Id<"users">
- claimedAt: optional number
- isArchived: boolean (soft delete)
Indexes:
- by_groupId
- by_groupId_and_userId

### expenses
- groupId: Id<"groups">
- description: string
- amountCents: number
- currency: string
- paidByMemberId: Id<"groupMembers">
- createdByUserId: Id<"users">
- splitType: "equal" | "custom"
- createdAt: number
Indexes:
- by_groupId
- by_groupId_and_paidByMemberId

### expenseShares
- groupId: Id<"groups">
- expenseId: Id<"expenses">
- memberId: Id<"groupMembers">
- amountCents: number
- createdAt: number
Indexes:
- by_groupId
- by_expenseId
- by_groupId_and_memberId

### payments
- groupId: Id<"groups">
- fromMemberId: Id<"groupMembers">
- toMemberId: Id<"groupMembers">
- amountCents: number
- note: optional string
- createdByUserId: Id<"users">
- createdAt: number
Indexes:
- by_groupId
- by_groupId_and_fromMemberId
- by_groupId_and_toMemberId

### memberBalances (optional derived table for scale)
- groupId: Id<"groups">
- fromMemberId: Id<"groupMembers">
- toMemberId: Id<"groupMembers">
- amountCents: number (net amount owed from -> to)
- updatedAt: number
Indexes:
- by_groupId
- by_groupId_and_fromMemberId
- by_groupId_and_toMemberId

## Balance computation (chosen: on-read)
Compute balances on demand (simple, great for early scale).
- For each expense:
  - For each share: create debt from member -> payer for amountCents (skip if member == payer).
- For each payment:
  - Reduce debt from fromMemberId -> toMemberId by amountCents.
- Aggregate by (fromMemberId, toMemberId).
- Normalize: if both (A->B) and (B->A) exist, net them to a single direction.
- Return only positive balances (amountCents > 0).

Optional later optimization:
- Maintain `memberBalances` on write once data volume warrants it.

## Split logic
### Equal split
- Input: selected memberIds.
- Compute base = floor(amountCents / count).
- Distribute remainder +1 cent to the first N members (stable order) to preserve total.
- Create one expenseShare per member.

### Custom split
- Input: list of {memberId, amountCents}.
- Validate sum == expense.amountCents.
- Create expenseShares for each entry (allow zero? default no).

## Invite and claim flow
- Group has an `inviteCode` used for deep links: `/invite/[code]`.
- Visiting invite link:
  - If not signed in, prompt phone auth, then return to invite.
  - If signed in, show group summary and list unclaimed members.
- Claiming:
  - User selects a member record (unclaimed) and confirms.
  - Mutation checks:
    - member belongs to group
    - member.userId is null
    - user is not already claimed in group (unique constraint via index)
  - Mutation sets `member.userId`, `claimedAt`.
- Optional: allow “I’m not on the list” to create a new member record.

## Permissions model
- Any signed-in user who is a member of a group can:
  - view group data
  - add expenses for the group
  - record payments
- Only group creator can:
  - edit group settings
  - archive members
  - regenerate invite code
- Unclaimed members can be referenced in expenses and payments.

## Convex functions (public API)
Use new function syntax with validators.

### Auth/Profile
- `profiles:me` (query) -> current profile, or null.
- `profiles:upsert` (mutation) -> create/update displayName.

### Groups
- `groups:create` (mutation)
  - args: name, currency, memberNames[]
  - creates group, members (unclaimed), inviteCode
- `groups:getByInviteCode` (query)
  - args: inviteCode
- `groups:listForUser` (query)
  - args: none
- `groups:get` (query)
  - args: groupId

### Members
- `members:listByGroup` (query)
  - args: groupId
- `members:claim` (mutation)
  - args: memberId
- `members:create` (mutation, optional)
  - args: groupId, displayName

### Expenses
- `expenses:create` (mutation)
  - args: groupId, description, amountCents, paidByMemberId, splitType, splitMembers or customAmounts
  - creates expense and shares
- `expenses:listByGroup` (query)
  - args: groupId

### Payments
- `payments:record` (mutation)
  - args: groupId, fromMemberId, toMemberId, amountCents, note
- `payments:listByGroup` (query)
  - args: groupId

### Balances
- `balances:getByGroup` (query)
  - args: groupId
  - returns pairwise owed amounts with member display names

## Next.js pages and UI
- `/` landing + auth status
- `/groups/new` create group form (name, currency, member names list)
- `/groups/[groupId]` group dashboard
  - summary cards (total expenses, total payments, your net)
  - balances table (who owes who)
  - recent expenses + payments
  - CTA: add expense, record payment
- `/groups/[groupId]/expenses/new` add expense form
  - payer dropdown (groupMembers)
  - split type toggle + member selector
  - validation and live split preview
- `/groups/[groupId]/payments/new` record payment
- `/invite/[code]` invite flow
  - if unclaimed members exist: list with claim buttons

## Edge cases and validation
- Prevent negative or zero amounts.
- Enforce currency consistency within a group.
- Rounding for equal splits must preserve sum; always store in cents.
- Prevent duplicate claim of the same member.
- Handle members leaving (archive) without deleting historical data.

## Implementation phases
1. Schema + core Convex functions for groups/members/expenses/payments.
2. Invite/claim flow + group dashboard with balances (on-read compute first).
3. Split UI and validations + expenses list.
4. Payments UI + balances table improvements.
5. (Optional) move to derived balances table for performance.
