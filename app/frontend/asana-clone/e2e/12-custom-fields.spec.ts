import { test, expect, login } from './auth.setup';

test.describe('Custom Fields', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can navigate to custom fields page', async ({ page }) => {
    await page.goto('/custom-fields');
    await expect(page.locator('text=/Custom Fields|Custom fields/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows custom field types', async ({ page }) => {
    await page.goto('/custom-fields');
    await page.waitForTimeout(500);
    // Should show field type options or existing fields
    await expect(page.locator('text=/dropdown|text|number|Priority|Status/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('custom fields visible in task detail', async ({ page }) => {
    await page.goto('/project/p1');
    await page.locator('text=Design homepage hero section').first().click();
    await page.waitForTimeout(500);
    // Custom field values should be visible (Priority, Status)
    await expect(page.locator('text=/Priority|Status/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
