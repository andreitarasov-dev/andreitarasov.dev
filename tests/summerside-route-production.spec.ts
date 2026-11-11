import { test, expect } from '@playwright/test';
import { mockImages } from './mockImages';

test('route enhancement stays hidden without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route(url=>url.hostname!=='127.0.0.1',route=>route.abort());
  await mockImages(page);
  await page.goto('/summerside/', {waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-story-route]')).toBeHidden();
  await expect(page.locator('#overview')).toBeVisible();
  await context.close();
});

test('only the visible route animates and unchanged scroll does not rewrite paths', async ({ page }) => {
  await mockImages(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/summerside/#berlin');
  const route = page.locator('[data-story-route]');
  await expect(route).toHaveAttribute('data-current-stage', '1');
  const visible = route.locator('[data-stage="1"] .route-desktop');
  await expect.poll(() => visible.evaluate(svg =>
    svg.querySelector('[data-route-path]')!.getAttribute('d') !== svg.querySelector('.route-base')!.getAttribute('d'),
  )).toBe(true);
  expect(await route.locator('svg:not(.route-desktop), [data-stage="2"] svg').evaluateAll(svgs =>
    svgs.every(svg => svg.querySelector('[data-route-path]')!.getAttribute('d') === svg.querySelector('.route-base')!.getAttribute('d')),
  )).toBe(true);
  // Once parked at the start, additional scroll events should not rewrite geometry.
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(route).toHaveAttribute('data-progress', '0');
  const mutations = await route.evaluate(async el => {
    let count = 0;
    const observer = new MutationObserver(records => { count += records.length; });
    for (const path of el.querySelectorAll('[data-route-path]')) {
      observer.observe(path, { attributes: true, attributeFilter: ['d'] });
    }
    for (let i = 0; i < 3; i++) {
      dispatchEvent(new Event('scroll'));
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }
    observer.disconnect();
    return count;
  });
  expect(mutations).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.getElementById('jonkoping')!.scrollIntoView({ behavior: 'instant' }));
  await expect(route).toHaveAttribute('data-current-stage', '2');
  await expect.poll(() => route.locator('[data-stage="2"] .route-compact').evaluate(svg => {
    const full = svg.querySelector('.route-base')!.getAttribute('d')!;
    const prefix = svg.querySelector('[data-route-path]')!.getAttribute('d')!;
    return prefix !== full && full.startsWith(prefix.slice(0, prefix.lastIndexOf('L')));
  })).toBe(true);
});
