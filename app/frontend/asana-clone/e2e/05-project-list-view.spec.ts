import { test, expect, login } from './auth.setup';

test.describe('Project List View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1');
  });

  test('displays project name in header', async ({ page }) => {
    await expect(page.locator('text=Website Redesign').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows sections as collapsible groups', async ({ page }) => {
    await expect(page.locator('text=To do').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
  });

  test('displays tasks in the list', async ({ page }) => {
    await expect(page.locator('text=Design homepage hero section').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows filter/sort/group controls', async ({ page }) => {
    await expect(page.locator('text=/Filter/i').first()).toBeVisible();
    await expect(page.locator('text=/Sort/i').first()).toBeVisible();
  });

  test('can click on a task to open detail pane', async ({ page }) => {
    await page.locator('text=Design homepage hero section').first().click();
    // Task detail pane should show the assignee field
    await expect(page.locator('text=Assignee').first()).toBeVisible({ timeout: 5_000 });
  });
});
