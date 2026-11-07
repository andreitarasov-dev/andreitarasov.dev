# Summerside migration audit

Source commit: `99ad53bd96944388f1ff4e0e9c7b72e8985eccb4` in andreitarasov-dev/saladNights.github.io.

Recovered: 195 ordered gallery photographs, 14 city narratives, four surrounding sections, nine packing-list groups, 25 prose link destinations, and four additional inline images. Both cycling tracks are decoded completely; stage 2 contains two arcs. Route endpoints are the actual recorded locations, not city-centre coordinates.

Baseline: build passed; browser suite 37 passed and 5 visual tests intentionally skipped outside Chromium. Existing Astro static request.headers warning and npm dependency audit findings predate this feature; no broad dependency upgrade attempted.

Editorial: English is a complete draft for author review. Original heatstroke advice and blanket train-carriage claim are preserved but must not be published without separate present-day context or author revision. Historical camping and motorhome-address claims also remain situated in 2018. Original links retained; their ongoing availability is not yet certified. Map dataset provenance beyond the author's repository remains unconfirmed; attribution must be checked before release.

Photos: all 199 public image responses were successfully measured. Manifest uses real preview-image dimensions, not assumed aspect ratios. Current legacy thumbnails are intentionally temporary; full-size sources remain available via image links. Originals have not been provided. Descriptive photograph-specific alt text still needs visual review with the original export; current gallery alternatives describe the city and sequence without inventing depicted subjects.

Rulings: native implementation uses a feature branch in the existing checkout. Article JSON groups original sections rather than using a flat block union, preserving all original section/photo associations. Pure geometry tests reuse Playwright's runner. UI tests mock external photos for determinism; real image rendering is checked separately.

Release prerequisites: author translation/editorial approval; originals mapping and derivative export; stable public asset base URL; photo-specific alternatives; geographic attribution; full verification and independent final review. No deployment or push performed.
