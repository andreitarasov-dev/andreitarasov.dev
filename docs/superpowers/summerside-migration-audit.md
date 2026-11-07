# Summerside migration audit

Source commit: `99ad53bd96944388f1ff4e0e9c7b72e8985eccb4` in andreitarasov-dev/saladNights.github.io.

Recovered: 195 ordered gallery photographs, 14 city narratives, four surrounding sections, nine packing-list groups, 25 prose link destinations, and four additional inline images. Both cycling tracks are decoded completely; stage 2 contains two arcs. Route endpoints are the actual recorded locations, not city-centre coordinates.

Baseline: build passed; browser suite 37 passed and 5 visual tests intentionally skipped outside Chromium. Existing Astro static request.headers warning and npm dependency audit findings predate this feature; no broad dependency upgrade attempted.

Editorial: English is a complete draft for author review. Original heatstroke advice and blanket train-carriage claim are preserved with separately labelled, user-approved present-day notes. The heatstroke note links to NHS guidance. Historical camping and motorhome-address claims also remain situated in 2018. Original links retained; their ongoing availability is not yet certified. Map dataset provenance beyond the author's repository remains unconfirmed; attribution must be checked before release.

Photos: all 199 public image responses were successfully measured. Manifest uses real preview-image dimensions, not assumed aspect ratios. Current legacy thumbnails are intentionally temporary; full-size sources remain available via image links. Originals have not been provided. Descriptive photograph-specific alt text still needs visual review with the original export; current gallery alternatives describe the city and sequence without inventing depicted subjects.

Rulings: native implementation uses a feature branch in the existing checkout. Article JSON groups original sections rather than using a flat block union, preserving all original section/photo associations. Pure geometry tests reuse Playwright's runner. UI tests mock external photos for determinism; real image rendering is checked separately.

Release prerequisites: author translation/editorial approval; originals mapping and derivative export; stable public asset base URL; photo-specific alternatives; geographic attribution; full verification and independent final review. No deployment or push performed.

Route validation: retained the original narrative percentages after checking their Mercator cumulative-distance locations against Frombork, Malbork, Wałcz, Berlin, Hanover, Jönköping and Norrköping. Desktop/mobile projections differ only by planar rotation and uniform scaling, preserving normalized path distance. This is validation, not recalibration.

Implementation checks: production build passed; full browser suite 115 passed/5 intentionally skipped; exporter tests 3 passed. Additional source-to-English coverage verifies all section associations and prose link destinations (normalizing HTML entities).

Independent final review: no actionable findings. Read-only review covered source fidelity, stage geometry/progress, exporter validation, and modal accessibility. Reviewer runtime checks were sandbox-limited; the parent ran the full browser suite. Source-to-English targeted tests passed (3/3) after the full suite.

Section review: applied user-requested metadata, intro/map simplification, full-width overview, smaller labels/dots, near-white water, corrected external link and always-visible packing list. Restored original widget city sets from pinned RouteScroller source; enlarged and vertically centered desktop widget with Kaliningrad above Amsterdam. Added regression checks for city counts, orientation and centering. Long-distance breadcrumb navigation uses an immediate jump to avoid WebKit interrupting smooth scrolling on the long photo article.
