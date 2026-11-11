# Cycling article production review — 10 November 2026

Scope: preserve the approved design and historical wording; address concrete performance, accessibility and resilience defects. The three author-approved proofreading changes are committed separately as df7e798.

## Changes

- Clip overview geography to its SVG viewport during the build. Initial HTML was 1,628,019 bytes (585,229 gzip); clipping alone reduced it to 424,168 bytes (110,453 gzip). The routes and visible map geography are retained.
- Hide the scroll route until JavaScript initializes. Without JavaScript, the static overview and article remain usable without two overlapping sticky route stages.
- Update only the visible route orientation and active stage, reuse cached SVG prefixes, and skip unchanged progress. Keep the continuous geometry reveal required by WebKit.
- Use a local article footer that retains the shared theme's SVG/design, with native keyboard buttons, accessible names and state, storage/clipboard failure handling, and deferred database connection. The original theme dependency is unchanged. Its shared bundle still includes Firebase eagerly; the local dynamic import does not remove that cost.

## Validation

- Astro production build and type checking.
- Browser regressions for route visibility, hidden-path updates, map payload bounds, keyboard sharing, clipboard denial, malformed stored likes, and no-JavaScript fallback.
- WebKit layout checks at 320, 390, 844 and 1440 pixels: no horizontal overflow. Inspected mobile and desktop footer screenshots.
- Local Chromium mobile simulation: 390×844, 4× CPU slowdown, 150 ms latency, 200 KB/s download. No uncaught JavaScript errors; observed CLS 0.064. This is a local lab sample, not a field Core Web Vitals claim. Third-party photos and fonts remain the largest loading costs.
- No test submitted likes to the live database.

## Remaining publication dependencies

- On 11 November the author supplied a folder containing 500 Sony RAW files, 135 XMP sidecars and 134 refined JPEGs. Image-content matching found 89 unique high-confidence matches to the 199 article photos; the least-close matches were visually checked. Responsive AVIF/WebP/JPEG export completed: 801 variants (86 MB total) from 751 MB of refined inputs. Every exported file was checked for dimensions and absence of EXIF/XMP/IPTC metadata. The candidate manifest and original mapping are preserved in ignored media-staging/summerside/. Hosting is not yet confirmed; no media URLs have been switched. The other 110 article photos remain unmatched; request the remaining phone/export folder and confirm durable hosting before calling photo delivery fully optimized.
- Many photo descriptions are generic city/sequence labels. A photo-specific alt-text pass remains worthwhile when processing originals.
- Keep the article unlisted (no homepage link, noindex/nofollow) until the author requests the public launch. Publication readiness does not itself announce the article.

## Dependency maintenance

Applied compatible updates, including Astro 4.16.1 → 4.16.19 and transitive lockfile updates. Production npm audit decreased from 24 advisories to 11 (1 moderate, 9 high, 1 critical). The remaining advisories are in Astro and its build/development dependency tree; the audit proposes Astro 7.4.10, beyond the shared theme's declared Astro 4/5 support. Do not describe the dependency audit as clean. A framework/theme compatibility upgrade remains a separate maintenance requirement. The deployed artifact is static HTML/CSS/JS, not an Astro SSR server.

Separated Node media-export tests from Playwright discovery. CI now runs `npm run test:media` explicitly; browser discovery includes only `*.spec.ts`.

## Final local verification

After compatible dependency updates: production build passed; 193 browser tests passed and 5 intentional skips across six projects; 3 standalone media-export tests passed. The four earlier no-JavaScript test timeouts were caused by waiting for external image loads, not fallback assertions; those tests now verify rendered HTML without depending on external hosts. Final browser discovery lists 198 tests in six spec files and excludes the standalone Node test file.
