import { test, expect, login } from './auth.setup';

test.describe('Comments & Activity Feed', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1');
    await page.locator('text=Design homepage hero section').first().click();
    await expect(page.locator('h2:has-text("Design homepage hero section")')).toBeVisible({ timeout: 5_000 });
  });

  test('shows comment textarea in task detail', async ({ page }) => {
    // Comment input is a textarea
    const commentInput = page.locator('textarea[placeholder="Add a comment"]');
    await commentInput.scrollIntoViewIfNeeded();
    await expect(commentInput).toBeVisible({ timeout: 5_000 });
  });

  test('can type in comment textarea', async ({ page }) => {
    const commentInput = page.locator('textarea[placeholder="Add a comment"]');
    await commentInput.scrollIntoViewIfNeeded();
    await expect(commentInput).toBeVisible({ timeout: 5_000 });
    await commentInput.fill('Test comment from Playwright');
    await expect(commentInput).toHaveValue('Test comment from Playwright');
  });

  test('shows activity feed with existing comments', async ({ page }) => {
    await expect(page.locator('text=Emily Johnson').first()).toBeVisible({ timeout: 5_000 });
  });
});
