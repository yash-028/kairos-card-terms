# kairos-card-terms

The card terms the Kairos iPhone app reads: earning rates, annual fees, statement credits and other benefits for the cards it recognises.

**Everything here is public information from card issuers' own pages. Nothing about you or your accounts is stored here.**

## How it is used

- The app reads `cards.json` from this repository's `main` branch at most once a day, from one fixed address.
- It accepts the file only if it passes the same checks as `validate.js` and its `rev` is higher than the one it already has. Otherwise it keeps what it had, and its own built-in list remains the fallback.
- When a card's own `rev` goes up, cards taken from the list pick up the new terms, unless you edited that card by hand in the app. Credits you have already marked as used are kept.

## How it is kept current

1. Once a month a scheduled Claude task checks each card against its issuer's page.
2. If anything changed, it opens a pull request listing each change with its source. The **Check card terms** workflow validates the file.
3. You review and merge, or close it. Nothing reaches the app until it is merged into `main`.

## Editing by hand

1. Edit `cards.json`. Raise the changed card's `rev` and the file's `rev` by one, and set `updated` to today.
2. Run `node validate.js` and fix anything it reports.
3. Commit to `main`, or open a pull request.

## Fields

| Field | Meaning |
| --- | --- |
| `rev` (file) | Goes up by one with every change. The app ignores a file whose `rev` is not higher than its own. |
| `k` | The card's short key. Never change it; the app links your cards by it. |
| `rev` (card) | Goes up when that card's terms change. |
| `rates` | Points or percent per dollar by category. `other` is required. Categories: dining, groceries, travel, gas, transit, streaming (shown as Subscriptions), online, drugstore, other. |
| `caps` | Yearly spend after which a category earns the `other` rate. |
| `credits` | `name`, `amount`, `period` (monthly, quarterly, semiannual, annual), `enroll`, `how`, and `m`: words that appear in the statement credit's description, joined with `\|`. |
| `perks` | Other benefits, with `enroll` when they need enrolling. |
| `seen`, `sources` | When and where the terms were checked. |

## Content rule

By the owner's organisation's rules, credits and categories for streaming, video, music or other entertainment services are not listed by name. The `streaming` earning category stays, shown in the app as Subscriptions.
