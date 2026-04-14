import { test as base, expect, type Page } from '@playwright/test';

/**
 * Login helper — fills the login form and waits for the app shell to appear.
 * Reusable across all test files.
 */
export async function login(page: Page) {
  await page.goto('/');
  // If already logged in (localStorage session), we may land on /home directly
  const loginVisible = await page.locator('text=Sign in to continue').isVisible().catch(() => false);
  if (!loginVisible) return; // already authenticated

  await page.locator('input[placeholder="Username"]').fill('admin');
  await page.locator('input[placeholder="Password"]').fill('admin');
  await page.locator('button[type="submit"]').click();
  // Wait for the app shell to load (sidebar text or home page content)
  await page.waitForSelector('text=My Tasks', { timeout: 15_000 });
}

/** Clear localStorage to reset seed data to defaults */
export async function resetState(page: Page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Extended test fixture that logs in before each test.
 */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect };
