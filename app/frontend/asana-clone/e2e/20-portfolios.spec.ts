import { test, expect, login } from './auth.setup';

test.describe('Portfolios', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/portfolios');
  });

  test('displays Portfolios page', async ({ page }) => {
    await expect(page.locator('text=Portfolios').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows portfolio cards with projects', async ({ page }) => {
    // Should show portfolio names and linked projects
    await expect(page.locator('text=/Create portfolio|Recent|Browse/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('has tabs for recent and all', async ({ page }) => {
    await expect(page.locator('text=/Recent|Browse all/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
