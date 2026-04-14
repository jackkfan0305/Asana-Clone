import { test, expect, login } from './auth.setup';

test.describe('Home Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/home');
  });

  test('displays personalized greeting', async ({ page }) => {
    // The home page shows "Good {timeOfDay}, {firstName}"
    await expect(page.locator('text=/Good (morning|afternoon|evening)/')).toBeVisible();
  });

  test('shows My Tasks widget with task list', async ({ page }) => {
    // Home page should display tasks
    await expect(page.locator('text=/upcoming|overdue|completed/i').first()).toBeVisible();
  });

  test('shows projects section', async ({ page }) => {
    // Should show project names from seed data
    await expect(page.locator('text=Website Redesign').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can navigate to My Tasks from sidebar', async ({ page }) => {
    await page.locator('text=My Tasks').first().click();
    await page.waitForURL('**/my-tasks');
    expect(page.url()).toContain('/my-tasks');
  });
});
