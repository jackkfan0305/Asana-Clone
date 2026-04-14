import { test, expect, login } from './auth.setup';

test.describe('Create Project', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can open create project from projects page', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('text=/New Project/i').first().click();
    await page.waitForTimeout(500);
    // Create project page shows "New project" heading
    await expect(page.locator('text=New project').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows project name input field', async ({ page }) => {
    await page.goto('/projects');
    await page.locator('text=/New Project/i').first().click();
    await page.waitForTimeout(500);
    // Should have a name input
    const nameInput = page.locator('input').first();
    await expect(nameInput).toBeVisible({ timeout: 5_000 });
  });

  test('New Project button visible on projects list', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('text=/New Project/i').first()).toBeVisible({ timeout: 5_000 });
  });
});
