import { test, expect, login } from './auth.setup';

test.describe('Tags & Color Labels', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/tags');
  });

  test('displays tags page', async ({ page }) => {
    await expect(page.locator('text=/Tags/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows existing tags from seed data', async ({ page }) => {
    // Seed data has tags (tag1-tag11)
    const tagItems = page.locator('[style*="border-radius"]').filter({ hasText: /.+/ });
    await expect(tagItems.first()).toBeVisible({ timeout: 5_000 });
  });

  test('tags have color indicators', async ({ page }) => {
    // Tags should display with colored badges
    await page.waitForTimeout(500);
    const coloredElements = page.locator('[style*="background"]').filter({ hasText: /.+/ });
    await expect(coloredElements.first()).toBeVisible({ timeout: 5_000 });
  });
});
