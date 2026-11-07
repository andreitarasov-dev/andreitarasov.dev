# Cycling story migration

Status: approved by the user on 2026-11-07, following approval of the main mockup. Detailed visual calibration is deferred. Publication requires separate authorization.

## Intent and agreed direction

Bring the author's 2018 cycling story into the current personal website as personal history. Translate it into natural English while retaining the original structure, anecdotes, humor, first-person perspective, and historical point of view. Do not turn it into a contemporary travel guide. A short present-day introduction is separate from the original account.

English only. Russian remains archived in the old repository. Do not introduce localization infrastructure or a language switcher.

The agreed experience is photo-led: a complete overview map near the beginning, then photographs and city passages alongside a route that draws continuously as the reader scrolls. City sections anchor route progress; interpolate between those anchors. Scrolling backwards reverses progress. Keep the two cycling stages separate; Amsterdam–Copenhagen was a bus transfer, not a cycling segment.

Match the current site's Inter typography, white background, restrained layout, and existing shared theme. Use the original route accent, `#ff6633`, for the article's routes, active position, and route legend. This is an article-specific accent, not a global theme change.

## Sources and current implementation

- Original article: https://elastic-allen-aacc4c.netlify.app/ru/summerside/
- Original source: https://github.com/andreitarasov-dev/saladNights.github.io/tree/master/src/pages/summerside
- Original article file: `src/pages/summerside/index.ru.js` in that repository.
- Supporting sources: `src/components/RouteMap`, `src/components/RouteScroller`, `src/components/Gallery`, and `src/data/{route_map,track1,track2,photo_sizes}.json`.
- Inspiration: https://www.nytimes.com/newsgraphics/2013/10/13/russia/index.html
- Current site: Astro 4.16.1, TypeScript, `@sikorsky/site` 0.5.4. The home page uses the shared Layout. Build command includes Astro checks. Playwright tests run against the production preview.

The old gallery inserts story passages at photo IDs. Preserve those associations and the photo sequence. Original route positions are percentage anchors for each of two tracks. Confirm geometry orientation and completeness before using them in new projections.

## Approaches considered

1. **Photo-led story with companion route — selected by the user.** Keeps the original emphasis on photographs, passages, and places. Desktop has a sticky route beside the story; mobile has a compact route above the story.
2. **Map-led chapters.** A larger cinematic map with passages controlling it. Rejected because it changes the pacing and reduces the photographs' prominence.

Technical proposal: static Astro content and SVG geography, enhanced by a small TypeScript scroll controller. Use geographic conversion utilities at build time if useful. Do not port the Gatsby/React application or add a full map engine for this fixed narrative. No tile service or map API key is needed.

## Scope and page structure

Proposed URL: `/summerside/`, retaining the original project's name. Add a simple entry under a new home-page Projects section, using existing theme conventions. No separate projects index is needed yet. Proposed link label: “Across Europe by bicycle”; description: “Two stages. 2,000 km. 24 days of riding.” These copy and URL choices are builder proposals for review.

Full article includes title, historical date, separate present-day note, overview map and chapter navigation, introduction, preparation, equipment and expandable packing list, the complete city-by-city photo story, ending, and acknowledgments. Keep useful original links and credits. Inventory broken/outdated links; do not silently substitute claims or erase historical references. Old advice that raises factual or safety concerns gets an editorial flag for the author, rather than an unannounced rewrite or an endorsement as current advice.

Translate all prose, captions where present, headings, equipment labels, and accessible map labels. Draft representative passages first for voice review. Translation is not summarization: the abbreviated mockup passages are not the migration source. The author's review of the complete translation is a release prerequisite.

Photo selection and order remain as in the original unless the author changes them. Include a keyboard-accessible enlarged-image viewer, preserving the old gallery's ability to inspect photographs. Avoid loading all full-resolution viewer images initially. Keep equipment disclosure accessible with native HTML where possible.

## Map and scrolling behavior

Overview: show both cycling tracks, important city labels, clear stage labels, and text identifying the bus transfer. City links navigate to corresponding article sections. Preserve correct geographic relationships and source attribution if required by the recovered data's provenance.

Desktop: readable text/photo column with a sticky companion route. Retain enough context to see where the current passage sits along its stage. Exact dimensions and label placement are deferred visual work.

Mobile: narrow, sticky route strip within the city-story portion; it must not dominate the viewport or obscure headings. It uses real route geometry adapted for the available space, not the mockup's arbitrary zigzag. Show current city/segment context. Outside the story, the sticky strip ends.

Progress: derive interpolation from adjacent city section positions relative to a documented viewport reading line. Use requestAnimationFrame for updates, handle reverse scroll, chapter jumps, resize, restored scroll position, and image layout changes. Clamp stage progress to 0–1. Hold stage 1 at its endpoint through the bus-transfer passage; switch to stage 2 at its first city anchor, with symmetric behavior when scrolling backwards. Never draw an invented line connecting the stages. Progress means position in the narrative, not precise geolocation of every photograph.

Reduced motion: retain geographic context and current-city information without continuous route motion. Without JavaScript, all article text, images, links, and a complete static overview remain usable. No scroll hijacking, auto-scrolling, or animation required to reveal prose.

## Photos and delivery

The author has originals. Proposed delivery architecture: retain originals in Immich; publish selected optimized derivatives at stable public URLs, preferably a dedicated static directory on the author's VPS. This is a proposal, not an established VPS configuration. Do not make article rendering depend on browser access to a private Immich API or expose credentials.

Create a provider-independent media manifest keyed by the old photo IDs: ordered position, source reference, dimensions, alt text, captions, and responsive derivative URLs. Match originals to existing IDs before export. Generate appropriate responsive sizes and modern formats with a broadly supported fallback; reserve aspect ratio and lazy-load below-fold images. Strip unnecessary original metadata from public derivatives.

Photo-host migration can be separate from page construction. Existing public Flickr URLs may be used temporarily for local previews, clearly tracked in the manifest; do not depend on them as the final delivery decision. For release, the author must supply the originals' location or export and confirm a public asset base URL. Credentials and remote deployment are outside the current planning scope. If the VPS is unavailable, text and reserved image space remain usable; do not couple site build availability to live Immich access.

## Implementation boundaries

This repository owns article content, route data, media manifest, article components, scroll controller, and tests. Reuse the shared layout; use local article styles for width and narrow-screen adjustments. Do not alter the shared theme package merely to accommodate this article. The shared theme currently has minimum widths that require checking on narrow phones.

Keep original text, media references, route geometry, and scroll anchor metadata separate from presentation. Use stable section IDs shared by content and both maps. The builder may select focused Astro components and a typed content format without adding a CMS or broad framework migration.

## Validation and review

- Content inventory: no missing passages, photos, sections, or acknowledgments; preserved order and story/photo associations; stage and summary figures match the source.
- Geometry: all source arcs are recovered in the right order; both stages reach their intended endpoints. The mockup only sampled geometry and must not be treated as verified production data.
- Functional browser checks: homepage entry, city navigation, smooth forward/backward route progression, stage transition, restored/deep-linked positions, and photo viewer keyboard close/focus behavior.
- Responsive checks: desktop, narrow phone (including 320px), landscape and short viewports; no horizontal overflow or sticky obstruction. Check real image loading rather than only mocks.
- Accessibility and fallbacks: reduced motion, JavaScript disabled, heading structure, focus visibility, descriptive alternatives, and legible map labels. Do not rely on color alone.
- Asset checks: missing image handling, dimensions, responsive selection, lazy loading, no full gallery original download on initial load, no private credentials or unnecessary metadata in outputs.
- Run `npm run build` and the existing Playwright suite plus focused article coverage. Preserve home-page baselines except for the intentional Projects addition; review any snapshot updates explicitly.
- One independent design challenge before implementation planning; one independent final code review. Use bounded smaller-model tasks for extraction/asset validation only where useful. Keep architecture and editorial decisions in the main conversation to avoid duplicated context and review churn.

## Mockup reference and limitations

Approved direction is represented by `preview-v3-red.html` under the local visualization session `68798-1794054470/content`. Later preview sessions may contain copies. It demonstrates typography, photo/text balance, desktop companion route, compact mobile route, and the original orange-red accent.

It is a throwaway layout study. It contains abbreviated draft text, a schematic sidebar route, incomplete story coverage, and a sampled overview. It is not production code or an approved final translation. Fine visual calibration remains explicitly deferred.

## Next decisions and release prerequisites

Independent builder check completed: no material ambiguity blocks implementation planning. The reviewer identified the bus-transfer interval as worth specifying; its endpoint-hold and stage-switch behavior is now explicit above.

Before implementation: review this design and its builder-proposed URL, homepage placement, image viewer, and delivery separation; then produce a task-level implementation plan.

Before final asset migration: locate the originals, confirm old-ID mapping, and decide the stable public asset destination. Before publication: author reviews translation and historical notes; complete technical checks and review; obtain publication authorization. Neither originals nor VPS access is needed to plan or build the first local article slice.

## Article alignment refinement

User requested alignment with Pavel's `sikorsky.design/autoload/` and `/ugc/` after reviewing the first implementation. Use their existing shared `@sikorsky/site` typography, lists, links, metadata, section rhythm and 893px outer article container. Add the title ID expected by the shared scroll breadcrumb. Remove the contents row, repeated chapter eyebrows, progress percentage and route instructions. Keep original prose, photographs, red routes, overview, and viewer. Place the 160px route beside the standard article column at >=1280px and use a compact sticky strip below that width. This supersedes earlier bespoke typography and map-card treatment.

## Section-by-section refinements

User edits: metadata is “Summer 2018 · cycling, maps”; omit the introductory present-day note and overview heading/legend. The overview follows the subtitle directly, uses shared full-width image styling, 8px corners, near-white water, thinner routes, smaller city labels/dots, and additional city links. Preserve separately approved heatstroke/train notes. Update the previous-trip link to t-j.ru/work_exchange/ and render all packing categories as a visible standard list.

The desktop scrolling widget now occupies a 280px rail within a wider journey layout. Its height is capped at 620px/70vh and centered vertically. Stage one runs Kaliningrad-to-Amsterdam top-to-bottom. Both stages restore the original RouteScroller city sets, including Magdeburg and Helsingborg, with small dots and quiet labels. Planar rotation preserves normalized path progress. Compact layouts use a wider horizontal projection and staggered labels.
