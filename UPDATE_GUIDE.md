# Monthly update guide (for the scheduled task)

1. For every card in `cards.json`, open the issuer's own card page (listed in `sources`, or found on the issuer's site). Prefer the issuer's page over review sites; use a review site only to understand a change, and never as the sole source for a number.
2. Compare: annual fee, earning rates and yearly caps, every statement credit (amount, how often it resets, whether enrollment is required, where it applies), and perks that need enrolling.
3. Leave out anything for streaming, video, music, film or other entertainment services. Do not name such services anywhere in the file, commit messages or pull request.
4. For each card that changed: update the fields, raise that card's `rev` by one, set `seen` to "<Month Year>, from <issuer>'s own card page", and make sure `sources` lists the page.
5. If anything changed: raise the file's `rev` by one and set `updated` to today. Run `node validate.js` until it passes. Commit to a new branch named `terms-YYYY-MM` and open a pull request titled "Card terms, <Month Year>". In the description, list each change as "Card: field, old → new (source link)".
6. If nothing changed, do not open a pull request. Say so in the run summary.
7. Never edit `k` values, and never merge the pull request yourself.
