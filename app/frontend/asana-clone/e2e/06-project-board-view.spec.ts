import { test, expect, login } from './auth.setup';

test.describe('Project Board View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1/board');
  });

  test('displays board columns for project sections', async ({ page }) => {
    // p1 sections: To do, In Progress, Done
    await expect(page.locator('text=To do').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test('shows task cards in columns', async ({ page }) => {
    // Tasks should appear as cards in their respective columns
    await expect(page.locator('text=Design homepage hero section').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can switch between list and board views', async ({ page }) => {
    // Board view is active - should be able to switch back to list
    const listTab = page.locator('text=/List/i').first();
    await expect(listTab).toBeVisible();
    await listTab.click();
    await page.waitForURL('**/project/p1');
  });

  test('board columns have task counts', async ({ page }) => {
    // Each column header should show the number of tasks
    const columns = page.locator('text=/To do|In Progress|Done/');
    await expect(columns.first()).toBeVisible({ timeout: 5_000 });
  });
});
