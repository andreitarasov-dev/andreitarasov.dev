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

## Completed validation and rollout

- Serial regeneration and normal suite both passed 54/54. Astro check: zero errors/warnings.
- Independent review found concurrent dependency edits and hidden quiet-command diagnostics. Both reproduced RED and fixed GREEN; final tooling suite 17/17.
- Hosted Pavel suite on the refreshed 0.5.2 baselines passed: https://github.com/ingmaesing/sikorsky.design/actions/runs/40195563152
- First release dry run exposed npm treating an unprefixed tarball path as GitHub shorthand. Explicit `./release-artifact/*.tgz` fixed both publication commands.
- Corrected dry run passed: https://github.com/andreitarasov-dev/sikorsky-site/actions/runs/40195830515
- Published 0.5.4 with provenance: https://github.com/andreitarasov-dev/sikorsky-site/actions/runs/40220046174
- Registry integrity: `sha512-tyNSyDgrSv1iQQxa/G6mUO2E5xlN2UBdTvkpclPNgNRmPqU4l1lWLvzGe7GcfEB3PT7HcxgmOk43GdAV2r1b2w==`.
- Both sites installed exactly 0.5.4 from npm; each install changed one package. Both production builds passed.
- Andrei: 37 browser tests passed, five intentional skips.
- Pavel: adopting the earlier 0.5.3 footer fix changed the heights of about/homepage/now. Reviewed those differences and refreshed only their affected baselines; normal full suite passed 54/54. All 52 runtime files plus exports/dependencies of the npm-installed package exactly match the tested candidate.

This first rollout uses explicit commits after both validations because Pavel needs reviewed visual-baseline changes alongside the dependency update. The ordinary upgrade command deliberately refuses to commit failed visual checks or unrelated file changes. For a future intentional visual change, review the diffs, refresh only the accepted baselines, rerun both sites' build/test commands, then commit each site's dependency files and its reviewed baselines together. Never automatically accept screenshots during an upgrade.

No code-review findings remain deferred. Existing site overflow noted in the earlier audit remains outside this release's scope.
