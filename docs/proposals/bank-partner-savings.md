# Saving for a trip with a bank partner — design for review

Status: **proposal, not built.** Nothing in this document exists in the
codebase yet. It is written to be argued with before Phase 1 starts.

## 1. The rule everything else follows

**TFE never holds, receives or moves a fan's savings.** The bank partner is
the account holder of record, runs KYC, keeps the ledger and moves the money.
TFE is the *front door* (open an account, make a deposit, see progress) and the
*context* (what the money is for: this trip, this date, this target).

Why this matters beyond preference:

- **Regulation.** Taking deposits needs a banking licence; collecting money to
  pass on needs a payment-service licence (in Kenya, CBK's National Payment
  System rules). Never being in the flow of funds keeps TFE out of both.
- **Trust.** "Your money is in an account in your name at Ecobank" is a much
  easier promise than "TFE is holding it for you".
- **The point of the product.** The fan gets an account and a saving record
  *at the bank* — that record, not anything TFE stores, is what builds credit.

One consequence to accept up front: **TFE's own Paystack account must not be
used for savings deposits.** Money would land in TFE's merchant balance first,
which is exactly the holding we are avoiding. Deposits go over the bank's own
rails (its M-Pesa paybill, its checkout, its STK push).

## 2. What exists today

`savings_goals` (Sprint 30) stores a name, a target, a currency, a target date
and a **self-reported** `current_amount`. No money moves. That stays useful as
the "goal" half of this design; the new work adds a real account behind it.

## 3. End-to-end journey

```
Fan                    TFE                          Bank partner
 │ plan trip ─────────► estimate + "Save for this trip"
 │ pick bank, consent ─► record consent (scopes, time)
 │                      ├─ open-account request ───► KYC in the BANK's flow
 │ ◄──────── redirect / embedded onboarding ────────┤ (ID, selfie, T&Cs)
 │                      ◄── webhook: account.active (opaque account ref)
 │ "Save KES 2,000" ───► deposit-instruction request ─► STK push / paybill ref
 │ approve on phone ──────────────── money goes straight to the bank ────────►
 │                      ◄── webhook: deposit.posted (amount, balance)
 │ sees progress ◄────── balance + history (cached, timestamped)
 │ books trip ─────────► payment instruction ──────► bank pays partner, or
 │                                                   releases to fan's M-Pesa
 │                      ◄── webhook: payment.completed → booking marked paid
```

### 3.1 Choose and consent
From the planner estimate or a booking ("Save for this trip"), the fan picks a
bank partner (`finance_partner` with savings enabled). A consent screen lists
exactly what TFE shares — name, email, phone, the goal — and what it will
receive back (balance, transactions for this account only). Consent is a
stored record with scopes, a timestamp and a revoke button.

### 3.2 Open the account — the bank's KYC, not ours
Two integration shapes, depending on what the bank offers:

| shape | how | TFE stores |
|---|---|---|
| **Redirect / hosted onboarding** (preferred) | TFE redirects to the bank's onboarding with a signed state; the bank sends the fan back and fires `account.active` | opaque account reference, status |
| **API onboarding** | TFE posts prefilled details; the bank still runs ID + selfie checks in its own SDK | same |

TFE never sees ID documents. This matches the Sprint 47 decision to keep KYC
data off TFE entirely.

### 3.3 Deposits
The fan taps "Save KES 2,000". TFE asks the bank for a **deposit instruction**
and shows it: an M-Pesa STK push to the fan's phone (best), or the bank's
paybill number + account reference, or a bank checkout link. The money goes
fan → bank. TFE learns the outcome from the bank's webhook, never by
receiving the money.

### 3.4 Visibility (the "API" you described)
What the fan sees on TFE: **total saved, target, % complete, projected finish
date at the current pace, deposit history, last updated time.** Source of
truth is always the bank:

- **Webhooks** (`deposit.posted`, `interest.posted`, `withdrawal.posted`,
  `account.status_changed`) keep a local cache fresh.
- **Pull on view** (`GET balance`, `GET transactions?since=`) fills gaps.
- If the bank is unreachable, show the last known balance **with its
  timestamp** — never a number that looks live but isn't.

### 3.5 Saving on a schedule
Where the bank supports standing orders / auto-debit (M-Pesa Ratiba, card
auto-debit), TFE sets it up through the bank. Where it does not, TFE sends a
reminder (bell + the Sprint 66 opt-in text) with a one-tap deposit. TFE does
not run recurring debits itself.

### 3.6 Using the savings
When the fan books, they choose "Pay from my savings". TFE sends a payment
instruction; the **bank** pays the travel partner (or releases the funds to the
fan's M-Pesa and the fan pays as today). The booking is marked paid when the
bank confirms, exactly like the Paystack callback today.

### 3.7 Credit history
The bank reports saving behaviour to credit bureaus and uses it in its own
scoring — that is its value. With the fan's consent, TFE can pass a "savings
record" summary into the existing loan application (`LoanApplication`, Sprint
14) to the **same** bank, so a fan who saved steadily for six months applies
with that history attached.

## 4. Integration contract

Banks' APIs differ, so TFE should own **one internal interface** and write one
adapter per bank (plus a sandbox adapter for demos and tests):

```php
interface SavingsProvider {
    public function startOnboarding(User $fan, SavingsGoal $goal): OnboardingStart;   // redirect URL or session
    public function depositInstruction(SavingsAccount $a, Money $amount, string $channel): DepositInstruction;
    public function balance(SavingsAccount $a): Balance;                                // amount + as_of
    public function transactions(SavingsAccount $a, ?Carbon $since): array;
    public function paymentInstruction(SavingsAccount $a, Money $amount, Payee $payee): PaymentInstruction;
    public function verifyWebhook(Request $r): WebhookEvent;                            // signature + replay check
}
```

TFE's own fan-facing endpoints (for the web app now, a mobile app later):

| method | path | purpose |
|---|---|---|
| GET | `/fan/savings` | goals + linked accounts, balances, progress |
| POST | `/fan/savings/{goal}/accounts` | start onboarding with a chosen bank |
| POST | `/fan/savings/accounts/{a}/deposits` | get a deposit instruction |
| GET | `/fan/savings/accounts/{a}/transactions` | history |
| DELETE | `/fan/savings/accounts/{a}/consent` | revoke data sharing |
| POST | `/webhooks/savings/{provider}` | bank → TFE events (signed) |

## 5. Data model (proposed)

- `savings_accounts` — user, finance partner, `savings_goal_id`, opaque
  `external_ref` (encrypted), status (`pending_kyc` / `active` / `closed` /
  `failed`), currency, `balance_cached` + `balance_as_of`.
- `savings_transactions` — account, `external_id` (**unique**, so a replayed
  webhook cannot double-count), type, amount, currency, status, `occurred_at`.
- `savings_deposit_intents` — account, amount, channel, external instruction
  ref, status, expiry (what the fan started, before the bank confirms).
- `data_sharing_consents` — user, partner, scopes, granted / revoked times.
- `savings_goals` keeps target and date; `current_amount` becomes derived from
  the linked account when one exists (self-reported otherwise).

Not stored: account numbers in clear, ID documents, card or M-Pesa PINs.

## 6. Edge cases to design for

- KYC fails or stalls → goal stays, account `failed`, fan offered another bank.
- Deposit pending → shown as pending, not added to the total until posted.
- Reversals / chargebacks → negative transaction from the bank, total drops.
- Trip in USD, account in KES → show both, with the rate and its date.
- Fan deletes their TFE account → consent revoked; **the bank account remains
  theirs**, and the copy must say so.
- Bank leaves the platform → fan keeps the account; TFE shows history it had
  and a link to the bank.
- Duplicate or out-of-order webhooks → idempotent on `external_id`, ordered by
  `occurred_at`; a daily reconciliation job compares TFE's cache to the bank.

## 7. Compliance checklist (needs your lawyer, not just engineering)

- Kenya Data Protection Act 2019: lawful basis (consent), purpose limitation,
  a data-sharing agreement with each bank, ODPC registration as controller.
- Confirm with CBK counsel that a deposit-instruction + webhook model keeps
  TFE outside PSP licensing (it should, since no funds touch TFE).
- Marketing rules: TFE must not imply it is the bank or that deposits are
  insured by TFE.

## 8. Commercials to agree with each bank

Who pays transaction fees; account-opening referral fee and/or revenue share
to TFE; branding inside the bank's onboarding; SLAs for webhooks and API
uptime; sandbox access and test accounts.

## 9. Phased delivery

| phase | scope | depends on |
|---|---|---|
| 0 | Bank agreement, DPA, sandbox credentials, API docs | business |
| 1 | Data model, `SavingsProvider` interface, sandbox adapter, consent, read-only balance + history on TFE | Phase 0 docs (sandbox adapter lets us start before) |
| 2 | Deposits via the bank's rails (STK push / paybill) + webhooks + reconciliation | bank API |
| 3 | Scheduled saving (bank standing orders) + reminders | bank support |
| 4 | Pay a booking from savings; savings record into loan applications | bank payment API |

## 10. Questions for you before Phase 1

1. Which bank first — Ecobank (the seeded demo partner) or another? Do they
   have a sandbox API today, and does each savings account get an M-Pesa
   paybill account reference?
2. Should the account be a **goal-locked** savings product (withdrawals only
   for the trip or after the date), or an ordinary savings account?
3. Currency of the account: KES only at first, or multi-currency?
4. When the fan pays a booking from savings, should the bank pay the travel
   partner directly (cleaner, needs a payee arrangement), or release to the
   fan's M-Pesa?
5. Do you want TFE to see transaction-level history, or only balance and
   deposits made through TFE? (Less data is less liability.)
