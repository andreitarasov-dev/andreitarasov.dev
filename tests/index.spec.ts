import { test, expect } from '@playwright/test';
import { mockImages } from "./mockImages.ts";

test.describe('homepage', () => {
  test('renders the name in the page heading', async ({ page }) => {
    await mockImages(page);
    await page.goto('/');

    await expect(page.locator('h1')).toHaveText('Andrei Tarasov');
  });

  test('shows the intro positioning statement', async ({ page }) => {
    await mockImages(page);
    await page.goto('/');

    await expect(page.getByText('Product engineer who owns features end-to-end')).toBeVisible();
    await expect(page.getByText('Nine years in the JavaScript ecosystem')).toBeVisible();
  });

  test('lists all seven roles in reverse-chronological order', async ({ page }) => {
    await mockImages(page);
    await page.goto('/');

    const items = page.locator('#professional-experience li');
    await expect(items).toHaveCount(7);

    await expect(items.first()).toContainText('Senior Product Engineer');
    await expect(items.first()).toContainText('CoachHub');
    await expect(items.last()).toContainText('Web Developer');
    await expect(items.last()).toContainText('Bit-Service');
  });

  test('exposes the three contact routes', async ({ page }) => {
    await mockImages(page);
    await page.goto('/');

    const intro = page.locator('.index-page header');
    await expect(intro.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/andrei-tarasov/'
    );
    await expect(intro.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/andreitarasov-dev'
    );
    await expect(intro.getByRole('link', { name: /tarasov\.a\.dev/ })).toHaveAttribute(
      'href',
      'mailto:tarasov.a.dev@gmail.com'
    );
  });

  test('matches screenshot', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Visual baseline is chromium-only');
    await mockImages(page);
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    // Astro's dev toolbar is injected by `astro dev`, which backs the test
    // server. Hide it so the baseline captures only the site itself.
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1
    });
  });
});