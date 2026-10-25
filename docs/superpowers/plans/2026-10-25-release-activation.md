# Release activation implementation plan

> Execute inline with superpowers:executing-plans. User approved direct commits, pushes, release and upgrades; do not open PRs.

**Goal:** Finish the approved shared-theme setup with reliable visual tests, a deliberate two-site upgrade command, and npm 0.5.4 publication.
**Architecture:** Keep three repos. Theme release validates a tarball. A local upgrade command takes an explicit published version, requires clean default-branch consumer checkouts, installs it in both, builds/tests sequentially, then commits only dependency files after both pass. It does not push automatically. Failures retain changes for inspection and make no commits.
**Tech stack:** Node 22, npm, Astro 4, Playwright, GitHub Actions OIDC.

## Constraints
- Preserve site content and styles; only refresh baselines justified by reviewed differences.
- No automatic snapshot rewriting in validation or upgrades.
- No npm token in repositories. npm login/setup requires owner interaction if unavailable.
- No PR creation; remove Dependabot theme-update configs and close only resulting bot PRs if any.

## Task 1: Repair and review visual tests
- Add a browser assertion that the local navigation logo decodes; run it against existing mock and observe failure.
- Preserve same-origin images in tests/mockImages.ts. Await font/image readiness before screenshots if evidence requires it.
- Review old/new screenshots: homepage and now content changed after baselines; case studies have a five-pixel global shift and old dev toolbar.
- Refresh production baselines, inspect representative desktop/mobile results, run the full suite twice as needed to establish stability. Diagnose cleanup hang before changing runner settings.
- Commit test changes directly after validation.

## Task 2: Direct upgrades
- Add scripts/upgrade-sites.mjs, tests/upgrade-sites.test.mjs and package script upgrade:sites to theme repo.
- Explicit version required; validate version/name/clean status/default branch and dependencies before mutation. Run npm install --save-exact @sikorsky/site@VERSION, npm run build, npm test for each site sequentially. Verify only package.json/package-lock.json changed. Commit both after both pass; report partial commit failure honestly, never reset user work or auto-push.
- Test invalid version/dirty checkout rejection, failed validation produces no commits, and success changes only dependency files using temporary real git repos and a controlled npm executable.
- Remove .github/dependabot.yml from both sites. Update three READMEs with the command and rollback procedure.
- Run npm test in theme, actionlint, review diff; commit and push approved changes.

## Task 3: Release and rollout
- Configure npm trusted publisher through package settings: andreitarasov-dev/sikorsky-site, release.yml, npm environment, direct publishing allowed. Verify saved settings; request action-time confirmation if browser security policy requires it.
- Update check.yml consumer SHAs to tested commits. Dispatch release dry run for 0.5.4 and inspect complete result.
- Dispatch actual publication only after successful dry run and trusted publisher setup; verify registry version and integrity.
- Run npm run upgrade:sites -- --version 0.5.4, verify dependency commits, push both defaults and verify production deployments.

## Review focus
Cross-repo failure handling, shell injection, dirty-worktree preservation, no commits before both validations, publication from correct workflow/environment, snapshot changes backed by visual review.
