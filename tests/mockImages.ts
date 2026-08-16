import type { Page } from "@playwright/test";

/**
 * 1×1 transparent PNG.
 *
 * The avatar and the nav logo are both sized by CSS (80px and 32px
 * respectively), so substituting a stub does not shift layout — it only removes
 * the test's dependency on Firebase Storage being reachable.
 */
const STUB_PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

export async function mockImages(page: Page): Promise<void> {
  await page.route(/firebasestorage\.googleapis\.com/, (route) => route.fulfill({ contentType: "image/png", body: STUB_PNG }));

  // The umami analytics script lives on an external host. Aborting it keeps
  // `networkidle` from waiting on a third party during tests.
  await page.route(/stats\.andreitarasov\.dev/, (route) => route.abort());
}
