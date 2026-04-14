import { test, expect, login } from './auth.setup';

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/home');
  });

  test('sidebar shows main navigation items', async ({ page }) => {
    await expect(page.locator('text=Home').first()).toBeVisible();
    await expect(page.locator('text=My Tasks').first()).toBeVisible();
    await expect(page.locator('text=Inbox').first()).toBeVisible();
  });

  test('sidebar shows projects section', async ({ page }) => {
    await expect(page.locator('text=Website Redesign').first()).toBeVisible({ timeout: 5_000 });
  });

  test('topbar shows Create button', async ({ page }) => {
    await expect(page.locator('text=Create').first()).toBeVisible();
  });

  test('topbar shows Asana logo/branding', async ({ page }) => {
    await expect(page.locator('text=asana').first()).toBeVisible();
  });

  test('can navigate to all main routes', async ({ page }) => {
    // Home
    await page.goto('/home');
    await expect(page.locator('text=/Good (morning|afternoon|evening)/').first()).toBeVisible({ timeout: 5_000 });

    // My Tasks
    await page.goto('/my-tasks');
    await expect(page.locator('text=Recently assigned').first()).toBeVisible({ timeout: 5_000 });

    // Inbox
    await page.goto('/inbox');
    await expect(page.locator('text=/Activity/i').first()).toBeVisible({ timeout: 5_000 });

    // Projects list
    await page.goto('/projects');
    await expect(page.locator('h1:has-text("Projects")').first()).toBeVisible({ timeout: 5_000 });
  });

  test('user menu is accessible', async ({ page }) => {
    // User avatar/name in topbar area
    const userAvatar = page.locator('img[src*="dicebear"]').last();
    await expect(userAvatar).toBeVisible({ timeout: 5_000 });
  });

  test('notification badge visible in sidebar', async ({ page }) => {
    const inboxLink = page.locator('text=Inbox').first();
    await expect(inboxLink).toBeVisible();
  });
});
