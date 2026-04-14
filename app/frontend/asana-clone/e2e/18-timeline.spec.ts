import { test, expect, login } from './auth.setup';

test.describe('Timeline (Gantt Chart)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1/timeline');
  });

  test('renders timeline view', async ({ page }) => {
    // Timeline page should show zoom controls or date headers
    await expect(page.locator('text=/Timeline|Zoom|Days|Weeks|Months/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows task bars on timeline', async ({ page }) => {
    await page.waitForTimeout(1000);
    // Should display tasks with start/end dates as bars
    await expect(page.locator('text=/Design|Implement|Create|Build/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('has zoom level controls', async ({ page }) => {
    // Zoom options: Hours, Days, Weeks, Months, Quarters, etc.
    await expect(page.locator('text=/Days|Weeks|Months/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
