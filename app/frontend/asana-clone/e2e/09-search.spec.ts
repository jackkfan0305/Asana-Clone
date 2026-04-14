import { test, expect, login } from './auth.setup';

test.describe('Search & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/home');
  });

  test('shows search input in topbar', async ({ page }) => {
    await expect(page.locator('input[placeholder="Search"]')).toBeVisible();
  });

  test('opens search overlay when typing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await searchInput.click();
    await searchInput.fill('Design');
    await page.waitForTimeout(500);
    await expect(page.locator('text=/Design/i').first()).toBeVisible();
  });

  test('shows task results matching query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await searchInput.click();
    await searchInput.fill('homepage');
    await page.waitForTimeout(500);
    await expect(page.locator('text=/homepage/i').first()).toBeVisible();
  });

  test('shows project results matching query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await searchInput.click();
    await searchInput.fill('Website');
    await page.waitForTimeout(500);
    await expect(page.locator('text=/Website Redesign/i').first()).toBeVisible();
  });

  test('search overlay shows results grouped by type', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search"]');
    await searchInput.click();
    await searchInput.fill('Design');
    await page.waitForTimeout(500);
    // Should show both project and task results
    await expect(page.locator('text=Design System').first()).toBeVisible();
  });
});
