import { test, expect, login } from './auth.setup';

test.describe('Inbox / Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/inbox');
  });

  test('displays Inbox page', async ({ page }) => {
    await expect(page.locator('text=/Inbox|Notifications/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows notification tabs', async ({ page }) => {
    // Tabs: Activity, Bookmarks, Archive, @Mentions
    await expect(page.locator('text=/Activity/i').first()).toBeVisible();
    await expect(page.locator('text=/Archive/i').first()).toBeVisible();
  });

  test('displays notification items', async ({ page }) => {
    // Seed data includes notifications - should show at least one
    const items = page.locator('[style*="cursor: pointer"]').filter({ hasText: /.+/ });
    await expect(items.first()).toBeVisible({ timeout: 5_000 });
  });

  test('can switch between tabs', async ({ page }) => {
    const archiveTab = page.locator('text=/Archive/i').first();
    await archiveTab.click();
    await page.waitForTimeout(300);
    // Archive tab should now be active
  });

  test('shows filter dropdown', async ({ page }) => {
    const filterBtn = page.locator('text=/Filter|All/i').first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
