# Netlify photo delivery — 11 November 2026

The author chose Netlify for the first release. Their account screenshot shows Legacy Free: 100 GB bandwidth and 300 build minutes. Immich remains available for the original photo library; the website does not depend on its API.

All 199 article photo placements use local static assets in public/media/summerside/. There are 198 unique photos: the introduction intentionally reuses a Berlin gallery image. Sources: 89 refined images from the first folder, 108 additional placements from the second folder, and two existing published edits retained to preserve their crop/colour treatment.

The deployment includes 1,782 content-hashed AVIF/WebP/JPEG variants, approximately 223 MB total, with no single image over 0.91 MB. This is the sum of every size/format, not a page-view download size. The browser chooses responsive image candidates; gallery main images and previews retain lazy loading. EXIF/XMP/IPTC metadata was removed and exported dimensions verified.

Root-relative URLs work in local previews and Netlify deploy previews. Netlify serves these immutable hashed assets with a one-year cache policy. To move delivery to the VPS later, upload the same files and replace the /media/summerside/ URL prefix in the manifest after verifying the destination.

Original folders, match reports, and upload staging are excluded from Git. Only generated website derivatives are committed. The site stays unlisted (no homepage entry; article noindex/nofollow) until the author requests public launch.

Validation before deployment: production build passed; 205 browser tests passed with 5 intentional skips. WebKit decoded the 480-pixel AVIF candidate at a 390-pixel viewport and the 960-pixel candidate on desktop. Independent review found no manifest, file, caching or source-selection blockers.
