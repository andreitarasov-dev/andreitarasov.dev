# Release activation record

User approved direct commits/pushes, no PRs, review and refresh stale screenshots, configure npm trusted publishing, release 0.5.4, and upgrade both websites.

## Visual review

- Homepage baseline last updated January 1, 2026; later source commits added work experience and notes. Old baseline also included Astro's dev toolbar.
- Now baseline contained December 2025 content; source was rewritten May 25, 2026. Current rendering matches the source.
- Avitologist/UGC old full-page captures included the dev toolbar and differed by five pixels in total height. Representative top/middle/bottom sections were reviewed.
- Existing image mock returned an empty PNG for `/logo.png`, causing a broken navigation logo in screenshots. A new browser test reproduced naturalWidth=0, then passed after preserving same-origin assets. External image mocking remains.
- Parallel full-page captures occasionally exceeded the old five-second assertion timeout. Playwright 1.50.1's update mode attempted to write an undefined screenshot, hiding the timeout behind a TypeError. A Firefox reproduction passed alone with API diagnostics. Local execution now matches CI's single worker, with 15-second default assertions, 60-second test timeout and 10-minute overall limit. HTML reports never open automatically.

## Direct upgrades

New `npm run upgrade:sites -- --version 0.5.4` checks both clean main checkouts and a published exact version, installs/builds/tests sequentially, then commits dependencies only when both pass. It does not push or rewrite snapshots. Failure leaves changes inspectable; cross-repo commits are not atomic and partial success is reported.

17 theme tooling tests passed, including seven new upgrade tests using disposable real Git repositories and a controlled npm executable.
Dependabot configurations removed from both websites. The superseded Pavel theme-upgrade PR #2 was closed.

## Publishing

npm trusted publisher saved after user confirmation and security-key authentication: `andreitarasov-dev/sikorsky-site`, workflow `release.yml`, environment `npm`, direct publish enabled, dist-tag management disabled. First publication is required to validate the connection.

## Pending verification

Serial baseline regeneration passed all 54 tests. Normal suite verification is running. Astro check passed with zero errors or warnings. Independent review identified concurrent dependency edits and discarded quiet-command diagnostics; both were reproduced by failing tests and fixed. The final tooling suite passed 17/17. Remaining: normal browser suite, commits/pushes, hosted dry-run, publication, consumer upgrades and deployment verification.
