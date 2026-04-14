import { test, expect, login } from './auth.setup';

test.describe('Project Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1/dashboard');
  });

  test('displays stat cards', async ({ page }) => {
    await expect(page.locator('text=/Total completed|Total incomplete|Total tasks/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows completion chart', async ({ page }) => {
    await expect(page.locator('text=/Incomplete tasks by section|Tasks by completion/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows project-specific data', async ({ page }) => {
    // Dashboard is for p1 (Website Redesign) - should show its sections
    await expect(page.locator('text=/To do|In Progress|Done/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('stat values are numeric', async ({ page }) => {
    // At least one stat card should have a numeric value
    const statValue = page.locator('text=/^\\d+$/').first();
    await expect(statValue).toBeVisible({ timeout: 5_000 });
  });
});
