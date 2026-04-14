import { test, expect, login } from './auth.setup';

test.describe('Teams & Members', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/teams');
  });

  test('displays Teams heading', async ({ page }) => {
    await expect(page.locator('text=Teams').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows seed teams', async ({ page }) => {
    await expect(page.locator('text=Engineering').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Design').first()).toBeVisible();
    await expect(page.locator('text=Marketing').first()).toBeVisible();
  });

  test('shows team members by name', async ({ page }) => {
    // Teams page lists member names under each team
    await expect(page.locator('text=Jack Fan').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Sarah Chen').first()).toBeVisible();
  });

  test('shows member count per team', async ({ page }) => {
    // Members count shown next to each team
    await expect(page.locator('text=/Members/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
