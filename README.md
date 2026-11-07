# andreitarasov.dev

## Develop and check

Use the Node 22 LTS line selected by `.nvmrc`:

```sh
nvm install
nvm use
npm ci
npm run dev
```

Production verification uses the built site, including packaged theme assets:

```sh
npm run build
npx playwright install
npm test
```

Playwright starts `astro preview` on port 4321. Stop other servers on that port first.
The committed visual baselines are macOS baselines; do not overwrite them from Linux.

## Preview a shared style change

Keep `sikorsky-site`, `andreitarasov.dev`, and `sikorsky.design` as sibling checkouts.
Run `npm ci` in all three once. From `sikorsky-site`:

```sh
npm run dev:sites
```

This serves Andrei's site at http://127.0.0.1:4321 and Pavel's at http://127.0.0.1:4322.
Use `-- --andrei /path/to/andreitarasov.dev --pavel /path/to/sikorsky.design` for other locations.
Shared CSS/components reload live. Restart after editing theme integration or configuration.
The override uses `SIKORSKY_THEME_DIR` only in child processes and a link in the ignored
`.astro` cache. It does not rewrite dependency files or installed packages. Ctrl-C stops both servers.
Ordinary startup uses the published package. Production builds reject the local override.

## Adopt a theme release

From the sibling `sikorsky-site` checkout, run:

```sh
npm run upgrade:sites -- --version 0.5.4
```

Use the desired published version. Both website checkouts must be clean and on `main`.
The command installs that exact version, builds and tests both sites sequentially,
then commits their dependency files only after both pass. It never updates snapshots
or pushes automatically. Review the two commits and push each `main` branch to deploy.
If validation fails, changes remain uncommitted for inspection; fix the issue or
restore the dependency files and run `npm ci` before retrying from clean checkouts.

To check an unpublished package against both sites, run `npm run check:consumers` from
the theme checkout. It builds temporary copies and leaves this checkout unchanged.
The theme owns shared layout/styles; this repository owns content and deliberate local differences.

To roll back a theme update, revert the dependency-update commit (both `package.json`
and `package-lock.json`), run the build/tests, and redeploy the previous dependency version.
Do not delete or overwrite a published npm version.

## Cycling article and photographs

The English draft lives in `src/content/summerside/article.en.json`; the rendered
article is `/summerside/`. The source inventory and original Russian text are kept
alongside it for comparison. Current photo URLs are temporary legacy previews.

After collecting originals, create a JSON object mapping every ID in
`src/content/summerside/media.json` to a relative filename under the originals folder
(including `intro`, `packed-bicycles`, `verenti`, and `kona`). Then run with Node 22:

```sh
node scripts/export-summerside-media.mjs \
  --input /path/to/originals \
  --mapping /path/to/photo-mapping.json \
  --output /path/to/new-export-directory \
  --base-url https://photos.example.com/summerside/
node --test tests/media-export.test.mjs
```

The output directory must not exist. The exporter leaves originals untouched,
normalizes orientation, strips metadata, and writes AVIF/WebP/JPEG derivatives up
to 1600 pixels wide without enlargement. Hashed filenames support immutable caching.
It also writes a candidate `media.json`; it does not upload files or replace the
site manifest. Upload the generated images to static hosting, verify URLs and
image quality, then replace the site manifest with the candidate and rebuild/test.
Immich remains the private archive; the public article needs no Immich API access.

Before publication: author review of English, photo-specific alt text, asset URL
verification, and map-data attribution. See `docs/superpowers/summerside-migration-audit.md`.
