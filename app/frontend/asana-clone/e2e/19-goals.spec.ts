import { test, expect, login } from './auth.setup';

test.describe('Goals', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/goals');
  });

  test('displays Goals page heading', async ({ page }) => {
    await expect(page.locator('text=Goals').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows goal tabs', async ({ page }) => {
    // Tabs: Team goals, My goals, Strategy
    await expect(page.locator('text=/Team|My|Strategy/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows Create goal button', async ({ page }) => {
    await expect(page.locator('text=/Create goal/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('displays goal list with progress', async ({ page }) => {
    // Goals should have progress indicators
    await expect(page.locator('text=/Progress|Status|Name/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
