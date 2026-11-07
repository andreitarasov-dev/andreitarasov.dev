# Cycling Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user chooses task-by-task delegation. Steps use checkbox syntax for tracking.

**Goal:** Migrate the complete cycling article into the current website in English, with original photographs, an overview map, and smooth city-anchored route animation.

**Architecture:** Render the story and SVG geography in Astro at build time. Keep historical text, media references, ordered route geometry, and section anchors separate; enhance the static article with focused TypeScript for scrolling and photo enlargement. Public photo delivery is configurable through the media manifest and does not require a live Immich connection.

**Tech Stack:** Existing Astro 4.16.1, TypeScript, `@sikorsky/site` 0.5.4, Playwright; build-time geographic utilities and image tooling only as needed.

**Spec:** `docs/superpowers/specs/2026-11-07-cycling-story-design.md` (approved).

## Global Constraints

- English only. Russian remains archived in the old repository. Do not introduce localization infrastructure or a language switcher.
- Translate faithfully as personal history; the present-day note is separate. Do not substitute the shortened mockup text for the full source.
- Use the original route accent, `#ff6633`, for the article's routes, active position, and route legend.
- Keep the two cycling stages separate; Amsterdam–Copenhagen was a bus transfer, not a cycling segment.
- Reuse the shared layout; use local article styles for width and narrow-screen adjustments.
- No tile service, CMS, map API key, React migration, global theme changes, or public deployment in this implementation pass.
- Use Node 22 from `.nvmrc`. Tests run against the production build; do not overwrite macOS visual baselines from Linux.
- Preserve original photos and order. Never commit photo originals, credentials, or Immich API secrets.
- Author review of translation and final asset destination remain release prerequisites. They do not block a working local preview.

## Review Focus

1. TopoJSON contains multiple arcs or reversed arc references: both routes must retain source order and reach their actual endpoints (Task 1).
2. Reverse scrolling over the bus passage: hold stage 1 at its endpoint and switch stages symmetrically at the first stage-2 anchor (Task 4).
3. Late image loading, deep links, and restored scroll position: route state must reflect current layout without needing a fresh scroll event (Tasks 3–4).
4. A 320px-wide or short landscape viewport: theme minimum widths and sticky regions must not hide content or create horizontal overflow (Task 3).
5. Missing photos, disabled JavaScript, and reduced motion: the story and geographic context remain usable; full-resolution gallery assets are not eagerly downloaded (Tasks 3–5).

## File boundaries and shared contracts

- `src/content/summerside/source/`: original article, photo manifest, and geographic source snapshots, pinned to a source commit; reference material, not browser payload.
- `src/content/summerside/inventory.json`: source order, section IDs, photo IDs, anchor values, source commit, and explicit non-photo assets.
- `src/content/summerside/article.en.json`: translated blocks in source order. `StoryBlock` is a discriminated union: heading `{kind:'heading', id:string, level:2|3, text:string}`, prose `{kind:'prose', id:string, html:string}`, photo `{kind:'photo', photoId:string}`, packing list `{kind:'packing-list', id:string, title:string, html:string}`. HTML is locally authored and reviewed, never remote runtime input.
- `src/content/summerside/media.json`: array of `StoryPhoto {id:string, width:number, height:number, alt:string, caption?:string, fallbackUrl:string, sources:Array<{type:string, srcset:string}>, fullUrl:string, delivery:'legacy-preview'|'published'}`. Gallery and inline non-gallery photographs are both inventoried.
- `src/content/summerside/routes.json`: `RouteStage[]`, each `{id:1|2, coordinates:[number,number][], anchors:Array<{sectionId:string, progress:number, label:string}>}`. Coordinates are longitude/latitude in travel order; progress is 0–1 along the projected narrative path. Validate/recalibrate old percentages against source cities rather than copying blindly across projections.
- `src/lib/summerside/types.ts`: the interfaces above. `src/lib/summerside/geometry.ts`: build-time `buildStageGeometry(stage:RouteStage): {path:string, viewBox:string, cities:Array<{sectionId:string,label:string,x:number,y:number}>}`; `buildOverviewGeometry()` returns land paths, both route paths, city coordinates, and a viewBox. Project complete routes; keep normalized progress tied to the narrative projection.
- `src/lib/summerside/progress.ts`: pure `resolveProgress(anchors: Array<{stage:1|2, sectionId:string, top:number, progress:number}>, readingY:number): {stage:1|2, progress:number, sectionId:string}`. Sorted document-space anchors; interpolate only within a stage. Before/after bounds clamp; the interval across stages holds stage 1 at 1 until stage 2's first anchor.
- `src/components/summerside/{OverviewMap,StoryRoute,StoryPhoto,PhotoViewer,StoryBlocks}.astro`: presentation only. StoryRoute exposes `[data-story-route]`, `[data-stage]`, and `[data-route-path]`; city headings expose IDs matching route anchors. StoryPhoto emits a normal full-image link enhanced by the viewer.
- `src/scripts/summerside-route.ts`: `initStoryRoute(root:HTMLElement):()=>void`; `src/scripts/summerside-viewer.ts`: `initPhotoViewer(root:HTMLElement):()=>void`. Both return cleanup functions.
- `src/pages/summerside/index.astro`, `src/styles/summerside.css`: page composition and article-local styling. Modify `src/pages/index.astro` for the Projects entry.
- `tests/summerside-{data,progress}.spec.ts`: pure data/function tests using the existing Playwright runner. `tests/summerside.spec.ts`: browser behavior. `tests/summerside-media.spec.ts`: export validation. `tests/fixtures/summerside/`: minimal deterministic image/topology fixtures.

## Task 1: Recover a complete, auditable source and route dataset

**Files:** source directory, inventory, routes, types, geometry, `scripts/import-summerside.mjs`, `tests/summerside-data.spec.ts`; `package.json` and lockfile only for necessary geographic utilities.

**Consumes:** old repository paths from the spec. **Produces:** inventory, typed route stages, complete overview geometry, and original media references for Tasks 2–5.

- [ ] Resolve and record the old repository commit; fetch the article and its referenced data/assets into source snapshots. Inspect the full files before fixing expected counts. Record original section/photo counts, IDs, source links, source attribution, route endpoints, and inline photos separately from gallery entries.
- [ ] Write failing data tests: all original photo IDs appear once in gallery order; all narrative anchors refer to real section IDs; stage progress is monotonic from 0 to 1; both stages preserve expected endpoints. Add a small topology fixture with reversed and multiple arcs and assert its exact decoded travel-order coordinates. Expected counts must come from the source snapshot, not the new output.
- [ ] Run `npx playwright test tests/summerside-data.spec.ts --project=chromium --reporter=line`; confirm a specific missing-data/implementation failure. If the runner needs `dist`, build the unchanged site once first.
- [ ] Implement the import script and geographic conversion using appropriate topology utilities rather than sampling the first arc. Preserve raw data, simplify only after verifying endpoints and visual fidelity, and generate ordered route metadata. Check attribution/provenance and record unresolved items in `docs/superpowers/summerside-migration-audit.md`.
- [ ] Run `npm run build` and the data test command; require passing results. Inspect generated overview and stage geometry against the original city order. Commit this coherent dataset with `feat: recover cycling story source and routes`.

## Task 2: Translate the full story and reconcile the photo sequence

**Files:** article English JSON, media JSON, types, migration audit; extend data tests.

**Consumes:** Task 1 inventory and source snapshots. **Produces:** complete English blocks and media manifest for rendering; unresolved editorial issues recorded explicitly.

- [ ] Draft the introduction plus one humorous passage and one descriptive city passage. Show them together for voice feedback while continuing the mechanical inventory. Preserve historical perspective; no generic travel-writing embellishment.
- [ ] Extend data tests to fail for missing/duplicate story IDs, omitted photos, reordered photo associations, empty alt text, invalid dimensions, or lost packing-list/acknowledgment sections. Assert source-to-translation block coverage using inventory IDs, not matching translated words.
- [ ] Run the data tests and confirm the new coverage checks fail before the content is complete.
- [ ] Translate all source blocks and meaningful captions; retain links and credits. Preserve semantic content when separating JSX into blocks. Derive image dimensions from actual images/metadata, never guessed aspect ratios. Use existing public URLs with `delivery:'legacy-preview'` until derivative publication. Record broken links and historical factual concerns for author review.
- [ ] Run data tests and `npm run build`; manually compare each source passage with its English counterpart. Deliver full translation for author review, flagging that approval is needed before publication. Commit with `feat: translate cycling story into English`.

## Task 3: Render a complete static article and home-page entry

**Files:** article page, homepage, article stylesheet, StoryBlocks, StoryPhoto, OverviewMap, StoryRoute; `tests/summerside.spec.ts`, relevant `tests/index.spec.ts` assertions and fixtures.

**Consumes:** complete blocks, manifests, and generated geometry. **Produces:** usable `/summerside/` with real content and static map fallbacks, plus controller DOM contracts.

- [ ] Add failing browser tests: homepage Projects link opens `/summerside/`; all inventoried sections are rendered; map city links target real headings; the complete packing list opens; JavaScript-disabled browsing retains text, photographs, and overview. Test widths 320, 390, and 1280px plus 844×390 landscape for no horizontal overflow.
- [ ] Run `npm run build` then `npx playwright test tests/summerside.spec.ts --project=chromium --reporter=line`; confirm missing-page assertions fail.
- [ ] Build the page with shared Layout and local style overrides scoped to this article. Add title, separate historical note, chapter links, complete overview, preparation, equipment disclosure, all story blocks, ending, and credits. Add Projects after Professional Experience. Use the approved mockup as a visual reference, not a source of content or production code.
- [ ] Render responsive photo markup with explicit dimensions, visible failure alternatives, descriptive alt text, normal full-image links, and lazy loading below the fold. Reserve layout space. Render both routes and stage labels statically before enhancement. Ensure mobile sticky treatment is bounded by the story and has room for anchored headings.
- [ ] Run build and focused tests. Inspect desktop, mobile, and landscape with real photographs in addition to deterministic test fixtures. Review the intentional home-page screenshot change on macOS before updating its baseline; re-evaluate the existing “short homepage fits” fixture if Projects legitimately changes its height rather than weakening footer assertions. Commit with `feat: add cycling story page and project link`.

## Task 4: Synchronize route drawing with scrolling

**Files:** progress function, route controller, StoryRoute, article page script integration; progress tests and browser tests.

**Consumes:** Task 1 anchor/geometry data and Task 3 DOM contracts. **Produces:** smooth, reversible narrative progress on desktop and mobile.

- [ ] Write failing pure tests: anchors `(stage1, top=100, progress=0)` and `(stage1, top=500, progress=1)` give 0.5 at readingY=300; values outside stage bounds clamp; stage2 first anchor at top=700 gives stage1/1 at 699 and stage2/0 at 700; returning to 699 restores stage1/1. Test equal-top anchors deterministically without NaN.
- [ ] Run `npx playwright test tests/summerside-progress.spec.ts --project=chromium --reporter=line`; confirm failure before implementation.
- [ ] Implement `resolveProgress` and `initStoryRoute`. Use a reading line 35% down the viewport, raised below the measured sticky strip if needed. Read layout only during scheduled animation frames; update SVG dash offsets/position and city context. Recompute on initialization, resize, pageshow, font readiness, and image/layout changes. Interpolate within stages and hold the bus interval as specified.
- [ ] Add browser assertions that real rendered route offset increases/decreases correctly, midway scrolling produces an intermediate value, crossing the bus interval never connects tracks, deep-link/reload state is correct without extra scrolling, delayed image loading preserves correct state, and mobile resizing does not leave stale geometry. Test reduced motion keeps a complete static route and updates city context without continuous drawing.
- [ ] Run build, pure tests, and focused browser tests. Manually scroll slowly and rapidly in both directions on desktop/mobile; inspect sticky boundaries and label collisions. Commit with `feat: animate cycling routes with story scroll`.

## Task 5: Add accessible photo enlargement and prepare portable exports

**Files:** PhotoViewer, viewer controller, StoryPhoto enhancement; `scripts/export-summerside-media.mjs`, media export tests/fixtures, README asset instructions, migration audit.

**Consumes:** media manifest. **Produces:** accessible viewer and reproducible local derivative export. Remote uploading is separate and waits for actual destination details.

- [ ] Add failing browser tests: photo activation opens its full image with descriptive context, Escape closes and returns focus, focus stays in the open dialog, and keyboard next/previous follows gallery order. With JS disabled the photo link still opens the image. Assert no full-image requests occur before activation; a failed image leaves a readable message and close control.
- [ ] Add export fixture tests asserting responsive widths 480, 960, and 1600 capped at original dimensions, unchanged orientation/aspect ratio, AVIF/WebP/JPEG outputs, absent EXIF GPS, unique stable ID-based filenames, and failure on missing or duplicate original mappings.
- [ ] Run focused tests and confirm failures before implementing. Implement native dialog enhancement with lazy full-image assignment and bounded optional next-image prefetch. Keep viewer code local to the article.
- [ ] Implement `node scripts/export-summerside-media.mjs --input <originals-directory> --mapping <id-to-file.json> --output <directory> --base-url <public-base-url>` using a maintained image library. Emit derivatives and a candidate media manifest; never mutate originals or silently overwrite published files. Add content hashes to filenames. Build/run article using manifest URLs without contacting Immich.
- [ ] Run fixture tests, build, and viewer checks. Document mapping/export commands and publication requirements. Test one real source photo when the author supplies originals; until then clearly mark real-original export as pending. Commit with `feat: add photo viewer and portable media export`.

## Task 6: Final review and release-ready local handoff

**Files:** focused test adjustments, migration audit, README; article fixes only where checks or author feedback justify them.

**Consumes:** Tasks 1–5 and author editorial feedback. **Produces:** reviewed local implementation with explicit release prerequisites.

- [ ] Reconcile every spec requirement against its implementation and test evidence in the audit. Confirm all source passages/photos are accounted for and both full routes reach verified endpoints. Do not substitute automated coverage checks for translation review.
- [ ] Run `npm run build` and `npm test` against the production preview. Diagnose failures before editing expectations. If a configured browser binary is missing, install that browser using the existing Playwright workflow or report the exact unrun project; never claim an unrun check passed.
- [ ] Perform visual checks with real photos on desktop and narrow/short mobile viewports; verify reduced motion, JavaScript disabled, image failure, keyboard viewer use, and deep links. Record initial JS and image transfer sizes, checking that geography processing is not shipped to the browser and gallery originals are not eagerly loaded. Calibrate visual details with the author here.
- [ ] Request one independent final code review covering spec compliance, route ordering/interpolation, keyboard behavior, payloads, and regression risk. Resolve material findings and rerun only affected checks plus build as needed.
- [ ] Commit the reviewed corrections with `fix: refine cycling story after review`. Report completed work, check results, translation approval status, and any pending originals/asset-host decisions. Do not deploy or push as part of this task.

## Execution recommendation and self-review

Recommend native execution in this chat, with bounded extraction/asset subtasks only when useful and one independent final review. The tasks share content IDs and geometry contracts, so a new implementer and reviewer for every task would duplicate substantial context.

Self-review complete: content/credit preservation is covered in Tasks 1–2; page, navigation, accessibility, and responsive fallbacks in Task 3; all scroll edge cases in Task 4; media delivery and viewer in Task 5; production verification and editorial/release prerequisites in Task 6. Shared interface names are consistent. All five review-focus conditions have explicit owner tests. Original-file access and public hosting are deliberately separate from the initial local implementation.
