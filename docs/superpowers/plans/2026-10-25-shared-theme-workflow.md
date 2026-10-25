# Shared Theme Workflow Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Work inline unless the user requests delegation.

**Goal:** Make shared style edits easy to preview and package releases safe to adopt in two independently owned websites.

**Architecture:** Preserve three repositories. The theme owns orchestration and package validation; each consumer has a small opt-in local-source configuration and independent production checks. Publishing and automated upgrades follow once local validation is dependable.

**Tech Stack:** Existing Astro, TypeScript, npm, Playwright, GitHub Actions; Node built-ins for orchestration; Dependabot for adoption.

## Global constraints

- Andrei is the sole theme developer and releaser.
- No manifest or lockfile mutations during local preview.
- No deployment, publication, or repository transfer as part of planning.
- Keep framework upgrades and unrelated refactors separate.
- Validate production builds, not just development servers.
- Do not claim a hosting preview or publishing permission exists until verified.

## Repository roots

- Theme: `/Users/andreitarasov/webstormProjects/sikorsky-site`
- Andrei: `/Users/andreitarasov/webstormProjects/andreitarasov.dev`
- Pavel: `/Users/andreitarasov/webstormProjects/sikorsky.design`

Paths below are relative to the specified repository. Read repository instructions and current status again before implementation. Keep changes reviewable per repository and avoid including unrelated user edits.

## Task 1: Establish reproducible baseline

**Files:** Both consumers' `package.json`, `package-lock.json`, `playwright.config.ts`, `.github/workflows/playwright.yml`; Andrei's `netlify.toml`; all repositories' runtime version file when introduced.

- [ ] Record current revisions, installed tool versions, manifest/lockfile hashes, and existing build failures separately from new failures.
- [ ] Run `npm ci` and `npm run build` in disposable consumer copies. Use no production credentials. Record whether Firebase absence is handled without build failure.
- [ ] Select and pin one supported Node release after verifying compatibility with the installed Astro and Playwright versions and hosting support. Use that version consistently in local instructions, CI, and hosting configuration; do not blindly upgrade Astro.
- [ ] Change the Netlify build command to `npm run build`. Verify Pavel's hosting provider and configured build command before proposing its deployment change.
- [ ] Make CI run `npm run build` before browser tests and configure its web server to use `npm run preview -- --host 127.0.0.1 --port 4321` against the built site. Retain local development testing as a separate option if useful.
- [ ] Verify both checked builds, then run existing browser tests and classify baseline failures. Commit this coherent change per affected repository.

## Task 2: Local theme selection and two-site preview

**Create in theme:** `scripts/dev-sites.mjs`, `tests/dev-sites.test.mjs`.

**Modify in theme:** `package.json`, `README.md`.

**Modify in each consumer:** `astro.config.mjs`; add `scripts/local-theme.mjs` only if configuration logic needs extraction.

**Interface:** `npm run dev:sites -- --andrei <directory> --pavel <directory>`; defaults are sibling directories. Child processes receive `SIKORSKY_THEME_DIR=<absolute theme root>`. Andrei runs on 4321; Pavel on 4322. Exiting disables the override because it exists only in child-process environments.

- [ ] First prove the resolution strategy on both current Astro configurations: the local integration must load during config evaluation, while Vite aliases map exact public component/style/font/util/lib subpaths to local source paths. An alias for browser imports alone is insufficient for the integration import.
- [ ] Use absolute paths and narrowly allow the selected theme directory through the dev server filesystem configuration. Preserve normal installed-package resolution when the environment variable is absent. Reject the override in production CI.
- [ ] Add process-runner tests for a missing checkout, wrong package name, occupied port, child startup failure, and interruption. Assert that the second child is stopped when the first fails and that manifest/lockfile bytes remain identical.
- [ ] Implement the launcher using `spawn` with argument arrays, inherited output, explicit working directories, and signal cleanup; avoid shell-interpolated paths. Add `"dev:sites": "node scripts/dev-sites.mjs"` to the theme scripts.
- [ ] Manually edit and restore one shared CSS rule, confirming both pages update; edit and restore integration configuration, confirming automatic restart or a clearly documented restart requirement.
- [ ] Stop preview and confirm ordinary consumer startup returns to the published theme. Document prerequisites, override behavior, ports, and failure messages; commit the task.

## Task 3: Validate the distributable against both sites

**Create in theme:** `scripts/check-consumers.mjs`, `tests/check-consumers.test.mjs`.

**Modify in theme:** `package.json`, `src/virtual.d.ts`, package exports as required, `README.md`.

**Modify in consumers if required:** `src/env.d.ts` to use the supported public type entry.

**Interface:** `npm run check:consumers -- --andrei <directory> --pavel <directory>`. Output identifies the tarball, both consumer revisions, check results, and retained failure artifacts. Exit nonzero if any check fails.

- [ ] Add safety tests demonstrating original consumers are unchanged after success and failure. Test a package with a deliberately missing required component and require validation failure.
- [ ] Create a temporary workspace with `mkdtemp`. Copy consumer source/assets while excluding `.git`, `node_modules`, `dist`, `.astro`, test output, and `.env*`. Include local source edits for local use and label that result accordingly.
- [ ] Run `npm pack --json --pack-destination <temporary directory>` in the theme. Parse the output rather than guessing the archive filename.
- [ ] In each disposable consumer run `npm ci`, then `npm install --no-save --package-lock=false <absolute tarball>`, then `npm run build`. Lockfile writes are forbidden in original checkouts, not merely restored afterward.
- [ ] Check the installed package version and that it is a real installation, not a local symlink. Retain the tarball for CI publication; the release job must not repack different contents.
- [ ] Correct `src/virtual.d.ts` to reference local theme types and add a public `./virtual` export. Update consumer references to `@sikorsky/site/virtual`; verify type checking resolves it from the tarball.
- [ ] Serve each built consumer and check homepage navigation, footer layout at tall/short viewports, loaded fonts, and one existing long article on Pavel's site. Require missing font responses or page errors to fail the check.
- [ ] Clean successful temporary workspaces; preserve failure logs with an explicit path and cleanup instruction. Commit and document the command.

## Task 4: Theme fixture and deterministic visual checks

**Create in theme:** `fixtures/site/package.json`, `fixtures/site/package-lock.json`, `fixtures/site/astro.config.mjs`, `fixtures/site/src/pages/index.astro`, `fixtures/site/src/pages/long.astro`, `fixtures/site/theme.config.ts`, `playwright.config.ts`, `tests/theme.spec.ts`, `.github/workflows/check.yml`.

- [ ] Build a small fixture using the real Layout, navigation, headings, paragraphs, lists, links, and optional-like behavior. Install the packed theme into it for CI so it exercises public exports.
- [ ] Add desktop/mobile assertions for navigation and footer placement. Add screenshots in one pinned browser/OS environment; do not reuse macOS snapshots on Linux or regenerate all existing baselines without review.
- [ ] Mock external analytics and Firebase; supply valid deterministic images for screenshot tests. Assert locally served fonts load successfully instead of mocking fonts.
- [ ] Run checks without production secrets. Exercise both absent Firebase configuration and mocked enabled-like behavior, without writing to a live database.
- [ ] Configure pull-request CI to run the fixture and consumer validation at explicit consumer revisions. Fetch access must be read-only. If a consumer is private, configure scoped read access before enabling that check; do not silently skip it.
- [ ] Preserve revision metadata, screenshots, and browser traces on failure. Review and commit initial visual baselines.

## Task 5: Explicit release workflow

**Create in theme:** `CHANGELOG.md`, `.github/workflows/release.yml`.

**Modify in theme:** `README.md`.

- [ ] Inspect npm owner permissions and current release conventions. Configure npm trusted publishing for this exact repository/workflow if the account allows it; report any missing owner action precisely.
- [ ] Require a committed version and matching changelog entry. Use explicit `workflow_dispatch` with a release version/ref and verify the selected commit's manifest matches the requested version.
- [ ] Serialize releases with a concurrency group. Fail if the version already exists. Run fixture and both consumer checks before enabling the publication job.
- [ ] Publish the validated tarball, not a second pack operation. Restrict `id-token: write` to the publication job. Ensure pull-request workflows cannot reach publication.
- [ ] Validate workflow syntax and run a dry validation dispatch before a real release. A real publication is a separate explicit release action.
- [ ] Document recovery from validation failure, existing-version failure, and publication success followed by metadata failure. Never retry by overwriting an existing version.

## Task 6: Independent automated adoption

**Create in both consumers:** `.github/dependabot.yml`.

**Modify in both consumers:** `README.md`; existing checks only if required for preview integration.

Use this initial configuration:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    allow:
      - dependency-name: '@sikorsky/site'
    open-pull-requests-limit: 1
```

- [ ] Validate the YAML, submit the configuration through each repository's normal review path, and verify Dependabot can resolve the public package.
- [ ] Verify update PRs run builds/browser checks without write credentials or access to production Firebase. Inspect deployment-preview configuration separately and verify a real preview link before documenting it as available.
- [ ] Keep merges manual. Document that scheduled update detection is not immediate and may include provider cooldown behavior.
- [ ] Exercise rollback on a temporary branch: revert a sample dependency-update commit and confirm the previous version builds.
- [ ] Add the routine to each README: preview locally, validate, release, review dependency PR, merge, roll back. Commit the task.

## Completion evidence

Capture one local style edit appearing in both sites, unchanged consumer dependency-file hashes after preview, both packed-package builds passing, deliberate missing-export failure, fixture desktop/mobile results, and workflow validation. Treat npm configuration, first real release, Dependabot PRs, and hosting previews as pending until observed rather than inferring them from YAML.

## References

- Design: `../specs/2026-10-25-shared-theme-workflow-design.md`
- Absolute alias paths: https://vite.dev/config/shared-options
- Tarball creation: https://docs.npmjs.com/cli/v6/commands/npm-pack/
- Trusted publishing: https://docs.npmjs.com/trusted-publishers/
- Dependency updates: https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference
