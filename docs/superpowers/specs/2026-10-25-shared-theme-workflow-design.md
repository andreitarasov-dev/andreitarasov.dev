# Shared theme development and release workflow

Date: 2026-10-25

## Agreed direction

Keep three repositories. Andrei alone develops and releases `@sikorsky/site`. Each website owns its content, assets, intentional visual differences, dependency version, and deployment. Shared typography, layout, and components belong in the theme. No repository transfers or monorepo migration.

The desired routine is: edit the theme, preview both websites, validate the package, release deliberately, and review an update PR in each website.

## Local preview

Provide a command in `sikorsky-site` that starts both sibling websites on ports 4321 and 4322 using the local theme sources. Accept explicit paths for nonstandard checkout locations. A development-only environment variable selects the theme checkout; ordinary commands continue using the installed published version. Resolve both the Astro integration and component/style imports from that checkout. Restart on integration/config changes when hot reload cannot apply them.

Do not rewrite consumer manifests, lockfiles, or installed packages for preview. Reject missing paths, incorrect package names, and occupied ports with actionable errors. Stop both child processes on interruption or child failure. Production CI must reject an accidentally enabled local override.

## Package validation

Create an actual `npm pack` tarball, install it in disposable copies of both websites, and run checked production builds plus focused browser checks. Copy source and assets, excluding Git metadata, dependencies, build output, and environment files. Never execute package installation against the original consumers during this check. Record consumer commit IDs and whether local changes were included. CI uses explicit consumer revisions and preserves those revisions as evidence.

A small theme-owned fixture covers typography, navigation, long and short pages, and likes-disabled behavior. Browser tests mock analytics, images/media, and Firebase as needed; mocks must return valid assets. Keep one deterministic visual baseline environment, plus desktop/mobile behavioral checks. Real deployment previews remain the visual acceptance step for external media and actual service configuration.

## Release and adoption

Release only an explicitly selected, committed version with a changelog entry. Validate the exact tarball that will be published. Publishing runs only after all required validation succeeds. Prefer npm trusted publishing after verifying package-owner access and configuring the authorized workflow. Do not introduce a long-lived publishing token by default.

Each consumer uses Dependabot for theme updates. These PRs are scheduled, not guaranteed immediately after publication. Each PR runs production builds and browser checks; deployment preview availability must be verified against hosting settings. Merging remains manual. Roll back a site by reverting its dependency-update PR and redeploying; correct a bad published release with a new version.

## Delivery sequence

1. Local two-site preview and packed-package validation.
2. Theme fixture, focused checks, consistent runtime/build commands.
3. Explicit automated publication and consumer update PR configuration.

Astro migration, optional-Firebase redesign, CMS adoption, and broad style refactoring are separate work. Fix package typing/export defects only when necessary to make the workflow reliable. The existing virtual type declaration references the obsolete `@sikorsky/astro-theme` name and consumers reference a subpath missing from package exports; validation must expose and resolve this contract.

## Acceptance

- A shared CSS edit appears in both running local websites without publishing.
- Preview exit leaves consumer dependency files unchanged.
- Packed-package validation builds both sites and fails on missing exports/assets.
- A theme change cannot publish before required validation passes.
- Each site can review, adopt, and revert a release independently.

## Evidence and limits

Based on local source inspection, not successful builds or live service inspection. Hosting settings, branch protections, npm publishing rights, and repository visibility remain execution-time checks. A missing permission must be reported specifically; it must not be treated as configured.
