import { test, expect } from '@playwright/test';
import { mockImages } from "./mockImages.ts";

test.describe('homepage', () => {
  test('renders the name in the page heading', async ({ page }) => {
    await mockImages(page);
    await page.goto('/');

    await expect(page.locator('h1')).toHaveText('Andrei Tarasov');
  });

  test('matches screenshot', async ({ page }) => {
    await mockImages(page);
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1
    });
  });
});