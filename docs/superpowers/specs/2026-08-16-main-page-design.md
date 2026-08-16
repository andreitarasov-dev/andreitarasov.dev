# Main page redesign — design doc

Date: 2026-08-16 (copy and markup revised 2026-08-17)
Status: implemented on branch `main-page-redesign`

> This document was updated after implementation so it describes what actually
> shipped. Two things changed materially from the original design: the intro copy
> (see "Intro copy") and the experience list's markup (see "Markup").

## Goal

Replace the placeholder main page with a real one. The page is a **launchpad**:
a short intro that establishes positioning, plus a professional experience list.
Projects and Notes sections are deliberately **not** built yet — they get added
incrementally, each when there are 2–3 real items to put in it.

Reference for structure and tone: https://sikorsky.design/ — built on the same
`@sikorsky/site` theme, designed with the same designer.

## Non-goals

- No new routes or pages.
- No nav changes.
- No Projects or Notes sections, and no placeholder/disabled entries for them.
  Nothing is promised on the page that does not exist behind it.
- No Firebase / LikeButton wiring.

## Source material

- **Notion "Work experience"** — full role history 2013→now, incl. English bullet
  points per role. Read in full. Mostly private (failures, salary, health,
  politics); only the factual timeline is used on the site.
- **LinkedIn profile** — headline and About text supplied by the user via
  screenshot. This is the public-voice wording and is the basis for the intro copy.
- LinkedIn is otherwise behind a login wall and could not be fetched.

## Page structure

Three blocks, in order:

```
[avatar]                    ← existing scroll→logo animation, preserved as-is
Andrei Tarasov
<intro copy>
<contact line>

Professional experience
  <role>  <company>  <years>
  ... ×7, reverse-chronological
```

### Intro copy

One lean tagline paragraph, then the contact line. Two `<h2>` blocks in the
header, nothing more.

> Product engineer with a bias for owning things end-to-end. Mostly web,
> occasionally not. Based in Leipzig.
>
> You can reach me on LinkedIn, GitHub, or at tarasov.a.dev@gmail.com.

**This deliberately does not read like the LinkedIn About it started from.**
The first draft was compressed from that profile and was rejected for two
reasons worth recording, because they constrain future copy here:

1. **No meta-commentary about the site.** Drafts that said "this is where the
   rest of it goes" or "I write about it here" were cut. The site should not
   explain its own existence to a visitor on arrival — the sections below do
   that by being there. The reference site's tagline never mentions itself
   either.
2. **Breadth is stated as a fact about what gets built, not as a promise about
   what will be posted.** "Mostly web, occasionally not" covers the non-web
   projects (hardware, data-visualisation writing, trip reports) without naming
   any of them, and stays true as new ones appear.

"Owning things end-to-end" is the one phrase kept from the LinkedIn wording: it
describes how he actually works rather than selling it.

The dropped About paragraphs (focus areas, mentoring, how teams work) remain the
natural seed for a future `/about` page. When that page exists, a second
paragraph pointing to it belongs here.

The `<meta name="description">` is kept identical to the tagline.

### Professional experience

Reverse-chronological. Role, company, years. No per-role descriptions — matching
the reference site.

| Role | Company | Years |
|---|---|---|
| Senior Product Engineer | CoachHub | 2025 – now |
| Senior Frontend Engineer | Monite | 2022 – 2025 |
| Frontend Engineer | Tinkoff | 2021 – 2022 |
| Frontend Engineer | Sibedge | 2019 – 2021 |
| Frontend Engineer | AIM | 2017 – 2018 |
| Frontend Engineer | Bryansk-Soft | 2017 |
| Web Developer | Bit-Service / advertise.ru | 2013 – 2017 |

Decisions, all confirmed with the user:

- **Full history, plain and factual.** All seven roles, no commentary. An unbroken
  timeline is more credible than a curated one.
- **Russian company names transliterated.** Бит-Сервис → Bit-Service,
  Брянск-Софт → Bryansk-Soft. Cyrillic entries on an English page read as
  unfinished and are unsearchable for a German recruiter.
- **Titles normalized to "Engineer".** Notion says "Frontend Developer" for
  AIM / Sibedge / Tinkoff; the site uses "Engineer" throughout for a consistent
  register.
- **Current title taken from LinkedIn**, not Notion: "Senior Product Engineer"
  (LinkedIn headline) rather than "Senior Frontend Engineer/Product Engineer".
  LinkedIn is the public-voice source of truth.
- **Year granularity, not months.** This leaves visible gaps at Jul–Dec 2017 and
  Dec 2018–Feb 2019 (both travel breaks). Accepted — years are honest and gaps at
  this granularity are unremarkable.

## Implementation

### Markup

Uses primitives already shipped in `@sikorsky/site/src/styles/global.css`, so no
new CSS is needed — **and no page-local `<style>` block either**. The theme
already provides `section { margin-top: 64.5px }` and
`section h2, section h3 { margin-bottom: … }`, including a `≤600px` tightening.

The experience list must follow the exact structure the theme is built for,
verified against the reference site's own source:

```html
<section id="professional-experience">
  <h3>Professional Experience</h3>
  <ul>
    <li>
      <div>
        <strong>Role, <span class="secondary">Company, 2013 – 2017</span></strong>
      </div>
    </li>
  </ul>
</section>
```

- A **plain `<ul>`**. Do *not* use `.list-with-secondary-items` — that class is
  for lists whose items are themselves secondary, and it mutes the bullets to
  grey. Using it made the whole block read as de-emphasised.
- **One `<div>` per `<li>`**, containing a single `<strong>`. Do not stack a
  second `<div class="caption">`; that puts the company on its own line at 16px.
- `.secondary` (not `.caption`) for company and years, inline in the same line.
- Year ranges use thin space + en dash + thin space (`U+2009 U+2013 U+2009`,
  i.e. `&thinsp;–&thinsp;`), which is the theme's convention.
- Section headings are Title Case: "Professional Experience".

Contact links are plain `.link` anchors inline in an `<h2>`.
`.link-caption-wrapper` is **not** used — it makes a whole wrapper clickable,
which suits a link-plus-caption block, not links inside a sentence.

### Cleanup: extract the avatar animation

`src/pages/index.astro` is ~380 lines, of which ~340 is the inline
`<script>` implementing the avatar→nav-logo scroll animation plus the
`.link-caption-wrapper` click delegation.

Move that script to `src/scripts/home-avatar.ts` and import it from the page.
Behavior must be identical: this is a move plus **type annotations only** — no
logic changes. (Annotations are required because the file is the source of all 90
current `astro check` errors; wrapping the body in a function with an early-return
guard also resolves the 70 possibly-null errors, since `const` narrowing then
reaches the nested closures.) Rationale: the
page is about to gain content and will be edited repeatedly as Projects and Notes
are added; leaving the machinery inline buries the markup every time.

The `.link-caption-wrapper` delegation was initially moved to its own module
(`src/scripts/link-captions.ts`) on the theory that future pages would want it.
**That module was subsequently deleted**: nothing in `src/` uses
`.link-caption-wrapper`, so it shipped as dead code that ran on every page load
and iterated an empty NodeList. If a future section needs whole-block click
behaviour, recover it from git history rather than carrying it unused.

### Metadata

`<Layout title description>` originally read `"Frontend Engineer | React Expert"`.
The description is now kept identical to the tagline paragraph, so there is one
piece of positioning copy on the page rather than two that can drift apart.

## Testing

Playwright is configured (`playwright.config.ts`, `tests/`), but **the suite does
not currently run**. Verified 2026-08-16:

- `tests/index.spec.ts` imports `./mockImages.ts`, which was never committed.
  `npx playwright test --list` → `Total: 0 tests in 0 files`. There are no
  committed snapshot baselines either. Restoring the harness is the first task.
- Separately, `npm run build` fails with 90 `astro check` errors, all in
  `src/pages/index.astro`'s inline script (implicit-any params, and
  possibly-null closures). Netlify is unaffected — `netlify.toml` runs
  `npx astro build`, which skips `astro check`. The script extraction below fixes
  these as a side effect.
- Coverage should be behavioural, not only pixel-based: assert the intro text,
  the seven experience entries and their order, and the three contact links. A
  screenshot baseline is generated once the page is in its final state.
- Verify the avatar→logo scroll animation still works after extraction: scroll
  from top to past the title, confirm the avatar lands on the nav logo and
  crossfades. This is the main regression risk in the cleanup.
- Verify `prefers-reduced-motion` path still short-circuits the transforms.
- Check mobile (≤600px) — the theme has breakpoint rules for `.caption` and the
  experience list.

## Future (explicitly not now)

- `/about` — the dropped About paragraphs (focus areas, mentoring, how teams work)
  are the seed.
- Projects — candidates: the Summerside bike-trip longread
  (https://saladnights.site/ru/summerside/, d3 map + scroll-synced track), Monite
  open-source SDK, GitHub.
- Notes — nothing written yet.
