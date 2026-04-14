import { test, expect, login } from './auth.setup';

test.describe('Task Detail Pane', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/project/p1');
    await page.locator('text=Design homepage hero section').first().click();
    await page.waitForTimeout(500);
  });

  test('shows task title in detail pane', async ({ page }) => {
    // The detail pane heading
    await expect(page.locator('h2:has-text("Design homepage hero section")')).toBeVisible({ timeout: 5_000 });
  });

  test('shows assignee field', async ({ page }) => {
    await expect(page.locator('text=Assignee').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows due date field', async ({ page }) => {
    await expect(page.locator('text=/Due date|Due/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows project field', async ({ page }) => {
    await expect(page.locator('text=Website Redesign').first()).toBeVisible();
  });

  test('can mark task as complete', async ({ page }) => {
    const completeBtn = page.getByRole('button', { name: /Mark complete/i });
    await expect(completeBtn).toBeVisible({ timeout: 5_000 });
    await completeBtn.click();
  });

  test('has close button to dismiss pane', async ({ page }) => {
    // Find and click the X close button
    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
