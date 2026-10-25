# Shared theme workflow delivery

## Implemented

Three independently owned repositories remain. The theme now has a two-site preview command, disposable packed-package checks, a small production fixture, and an explicit dry-run-default release workflow. Both consumers have opt-in local-theme configuration, Node 22 selection, checked production CI, theme-only Dependabot updates, and operational instructions.

Draft PRs:
- Theme: https://github.com/andreitarasov-dev/sikorsky-site/pull/1
- Andrei: https://github.com/andreitarasov-dev/andreitarasov.dev/pull/1
- Pavel: https://github.com/ingmaesing/sikorsky.design/pull/1

## Verification evidence

- Local shared CSS change reached both running websites; local font requests succeeded. Temporary marker was restored.
- Both consumers' package.json and package-lock.json remained byte-identical to the original checkouts.
- Final committed candidate tarball passed both consumer production builds, desktop/mobile browser smoke checks, and the fixture.
- Fixture: 8 checks passed without Firebase; 4 passed with a local Firebase adapter (the remaining cases are deliberately skipped in the opposite mode).
- Tooling: 10 tests passed, including invalid paths, occupied ports, child/descendant termination, temporary-copy isolation, and release guards.
- A deliberately broken tarball missing Layout was rejected by consumer type checking.
- Release version/commit/digest verification and npm publish --dry-run passed. No npm version was published.
- GitHub workflows passed actionlint. Andrei's hosted CI passed.
- Independent review identified a descendant cleanup defect; a real-process test reproduced it before the fix and passed afterward.

## Remaining activation and existing failures

The npm login returns E401. The npm owner must configure trusted publishing for repository `andreitarasov-dev/sikorsky-site`, workflow `release.yml`, environment `npm`. The GitHub environment has been created and restricted to the `master` branch. Real release activation requires merging the theme PR and running the workflow; this work did neither.

Pavel's unchanged screenshot references need separate review. The final existing suite has 28 passes and 20 failures, across homepage, now, avitologist, and ugc in different browsers. Targeted checks of all four pages also failed on the original development-server setup. A production-only image-mocking issue was fixed (real local optimized images are now preserved); no screenshot references were automatically rewritten. The new candidate-package smoke checks pass for Pavel's site.

Deployment preview settings have not been verified. No successful preview or deployed change is claimed.

## Decisions made during implementation

- Use a native worktree for Andrei and isolated local clones for the sibling repositories because the app's worktree API targets the current repository. The clones' changes are preserved in remote PR branches.
- Select the maintained Node 22 line rather than freezing an older local patch. Local verification ran on 22.22.2; hosted setup selects the available patch in that line.
- Use `.astro/local-theme` cache symlinks with preserved symlink paths. Direct external Astro 4 component IDs failed across filesystem roots. Consumer dependency installations remain untouched; the ignored cache is the extra local side effect.
- Disable likes when Firebase is absent. The original article page threw a null-database browser error; the patch fixes it without changing configured Firebase behavior.
- Report pre-existing horizontal overflow separately instead of mixing layout changes into this workflow work.
- Keep the old virtual type subpath and add the new public one. Consumer PRs continue to build with their currently published theme versions; type-path adoption can follow publication.
- Keep macOS fixture references to match existing site practice. Hosted reproducibility must be confirmed from actual CI rather than inferred from local screenshots.
- Preserve lockfile reading when installing a candidate in disposable copies. Disabling it re-resolved hundreds of unrelated dependencies; the corrected installation changes only the theme package.
- Keep external npm/hosting activation explicit. YAML does not prove account configuration or a deployment exists.

## Deferred minor

The fixture's footer geometry test sets desktop width for both projects. Mobile screenshots cover presentation, but a dedicated mobile geometry assertion remains a small follow-up.
