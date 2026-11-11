import { expect, test } from '@playwright/test';

// Never contact the live likes database during browser verification.
test.beforeEach(async ({ page }) => {
  await page.route(/firebaseio\.com|firebasedatabase\.app|googleapis\.com/, route => route.abort());
});

test('footer remains keyboard accessible with malformed saved likes and clipboard rejection', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('likedPages', '{broken');
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true });
  });
  await page.goto('/summerside/', {waitUntil:'domcontentloaded'});
  const copy = page.locator('[data-copy-link]');
  await expect(copy).toBeEnabled();
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(copy).toHaveText('Copy failed — try again');
  await expect(page.getByRole('button', { name: 'Like this article', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

test('saved like is recognized without writing to Firebase', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('likedPages', '["summerside"]'));
  await page.goto('/summerside/', {waitUntil:'domcontentloaded'});
  const button = page.getByRole('button', { name: 'You liked this article' });
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
});

test('without JavaScript, footer controls are disabled and the address stays readable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.route(url=>url.hostname!=='127.0.0.1',route=>route.abort());
  await page.goto('/summerside/', {waitUntil:'domcontentloaded'});
  await expect(page.getByRole('button', { name: 'Like this article', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Copy & Share:' })).toBeDisabled();
  await expect(page.locator('[data-article-footer] noscript span')).toBeVisible();
  await context.close();
});
