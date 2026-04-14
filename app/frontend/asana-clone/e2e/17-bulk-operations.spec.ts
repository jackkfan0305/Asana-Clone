import { test, expect, login } from './auth.setup';

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1');
    await page.waitForTimeout(500);
  });

  test('project list view shows tasks that can be selected', async ({ page }) => {
    // Tasks should be visible and clickable
    await expect(page.locator('text=Design homepage hero section').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows checkbox or selection indicators on tasks', async ({ page }) => {
    // Task rows should have checkboxes for completion
    const checkboxes = page.locator('input[type="checkbox"]').or(
      page.locator('[style*="border-radius: 50%"][style*="cursor"]')
    );
    await expect(checkboxes.first()).toBeVisible({ timeout: 5_000 });
  });
});
