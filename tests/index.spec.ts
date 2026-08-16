import { test, expect } from "@playwright/test";
import { mockImages } from "./mockImages.ts";

test.describe("homepage", () => {
  test("renders the name in the page heading", async ({ page }) => {
    await mockImages(page);
    await page.goto("/");

    await expect(page.locator("h1")).toHaveText("Andrei Tarasov");
  });

  test("shows the intro tagline", async ({ page }) => {
    await mockImages(page);
    await page.goto("/");

    await expect(page.getByText("Product engineer with a bias for owning things end-to-end")).toBeVisible();

    // A single tagline paragraph, plus the contact line — nothing else.
    await expect(page.locator(".index-page header h2")).toHaveCount(2);
  });

  test("lists all seven roles in reverse-chronological order", async ({ page }) => {
    await mockImages(page);
    await page.goto("/");

    const items = page.locator("#professional-experience li");
    await expect(items).toHaveCount(7);

    await expect(items.first()).toContainText("Senior Product Engineer");
    await expect(items.first()).toContainText("CoachHub");
    await expect(items.last()).toContainText("Web Developer");
    await expect(items.last()).toContainText("Bit-Service");
  });

  test("exposes the three contact routes", async ({ page }) => {
    await mockImages(page);
    await page.goto("/");

    const intro = page.locator(".index-page header");
    await expect(intro.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://www.linkedin.com/in/andrei-tarasov/");
    await expect(intro.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/andreitarasov-dev");
    await expect(intro.getByRole("link", { name: /tarasov\.a\.dev/ })).toHaveAttribute("href", "mailto:tarasov.a.dev@gmail.com");
  });

  test("matches screenshot", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "Visual baseline is chromium-only");
    await mockImages(page);
    await page.goto("/");

    await page.waitForLoadState("networkidle");

    // Astro's dev toolbar is injected by `astro dev`, which backs the test
    // server. Hide it so the baseline captures only the site itself.
    await page.addStyleTag({ content: "astro-dev-toolbar { display: none !important; }" });

    await expect(page).toHaveScreenshot("homepage.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.1
    });
  });

  // The footer is anchored by @sikorsky/site making `body` a flex column
  // (>= 0.5.3). Two things have to hold together, and fixing one has already
  // broken the other once: the footer must sit at the end of the document even
  // when the page is too short to fill the viewport, AND it must stay
  // left-aligned with the content column rather than centring itself.
  const footerCases = [
    { name: "viewport taller than the content", width: 1280, height: 1600, fits: true },
    { name: "content overflowing the viewport", width: 1280, height: 700, fits: false }
  ];

  for (const c of footerCases) {
    test(`footer is anchored and left-aligned — ${c.name}`, async ({ page }) => {
      await page.setViewportSize({ width: c.width, height: c.height });
      await mockImages(page);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const m = await page.evaluate(() => {
        const footer = document.querySelector("footer")!;
        const content = document.querySelector(".content")!;
        const f = footer.getBoundingClientRect();
        const c = content.getBoundingClientRect();
        const style = getComputedStyle(footer);
        return {
          viewportH: window.innerHeight,
          docH: document.documentElement.scrollHeight,
          footerBottom: f.bottom,
          footerLeft: f.left,
          footerWidth: f.width,
          contentLeft: c.left,
          contentWidth: c.width,
          marginBottom: parseFloat(style.marginBottom),
          scrolls: document.documentElement.scrollHeight > window.innerHeight + 1
        };
      });

      // Bottom edge plus its own bottom margin lands at the end of the
      // document — which, on a short page, is the bottom of the viewport.
      const end = Math.max(m.viewportH, m.docH) - m.marginBottom;
      expect(Math.abs(m.footerBottom - end)).toBeLessThan(2);

      // Left-aligned with the content column, not centred.
      expect(m.footerLeft).toBeCloseTo(m.contentLeft, 1);
      expect(m.footerWidth).toBeCloseTo(m.contentWidth, 1);

      if (c.fits) expect(m.scrolls).toBe(false);
    });
  }
});
