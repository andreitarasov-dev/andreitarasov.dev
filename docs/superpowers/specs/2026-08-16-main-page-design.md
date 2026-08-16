# Main page redesign — design doc

Date: 2026-08-16
Status: approved (structure), pending review (copy)

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

Compressed from the user's own LinkedIn About — his wording, trimmed to intro
length. The full About is four paragraphs; the reference site's intro is 1–2
sentences, so paragraphs 2–3 (the three focus areas, the team/mentoring material)
are dropped here. They are the natural seed for a future `/about` page.

> Product engineer who owns features end-to-end — from shaping the problem with
> product and design, through architecture, to the shipped interface and what the
> metrics say afterwards.
>
> Nine years in the JavaScript ecosystem, mostly React and TypeScript, and I still
> care a lot about how things look and feel. Based in Leipzig.
>
> You can reach me on LinkedIn, GitHub, or at tarasov.a.dev@gmail.com.

### Professional experience

Reverse-chronological. Role, company, years. No per-role descriptions — matching
the reference site.

| Role | Company | Years |
|---|---|---|
| Senior Product Engineer | CoachHub | 2025 — now |
| Senior Frontend Engineer | Monite | 2022 — 2025 |
| Frontend Engineer | Tinkoff | 2021 — 2022 |
| Frontend Engineer | Sibedge | 2019 — 2021 |
| Frontend Engineer | AIM | 2017 — 2018 |
| Frontend Engineer | Bryansk-Soft | 2017 |
| Web Developer | Bit-Service / advertise.ru | 2013 — 2017 |

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
new CSS is needed:

- `#professional-experience` — the stylesheet already targets this id
  (`margin-bottom`, `font-variant-numeric: slashed-zero` on its `ul li`).
- `.list-with-secondary-items` — list with muted secondary lines.
- `.caption` — company/years secondary text.
- `.link` / `.link-caption-wrapper` — contact links, with the existing click and
  keyboard handling.

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

The `.link-caption-wrapper` delegation is generic, not home-specific. It moves to
its own module (`src/scripts/link-captions.ts`) so future pages can import it
without dragging the avatar animation along.

### Metadata

`<Layout title description>` currently reads `"Frontend Engineer | React Expert"`.
Update the description to match the new positioning — drawn from the same About
text as the intro.

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
