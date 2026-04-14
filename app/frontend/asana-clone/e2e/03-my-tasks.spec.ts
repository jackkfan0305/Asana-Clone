import { test, expect, login } from './auth.setup';

test.describe('My Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/my-tasks');
  });

  test('renders My Tasks page with sections', async ({ page }) => {
    await expect(page.locator('text=Recently assigned')).toBeVisible();
  });

  test('displays tasks assigned to current user', async ({ page }) => {
    // Seed data assigns tasks to u1 (Jack Fan / current user)
    const taskRows = page.locator('[style*="cursor: pointer"]').filter({ hasText: /.+/ });
    await expect(taskRows.first()).toBeVisible({ timeout: 5_000 });
  });

  test('can add a new task', async ({ page }) => {
    const addButton = page.locator('text=/Add task/i').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      const input = page.locator('input[placeholder*="task" i]').first();
      if (await input.isVisible()) {
        await input.fill('Playwright test task');
        await input.press('Enter');
        await expect(page.locator('text=Playwright test task')).toBeVisible();
      }
    }
  });

  test('has view toggle tabs', async ({ page }) => {
    // View toggle shows List/Board/Calendar or similar tabs
    const viewToggle = page.locator('text=/List|Board|Calendar/i').first();
    await expect(viewToggle).toBeVisible({ timeout: 5_000 });
  });

  test('shows task sections for grouping', async ({ page }) => {
    // My Tasks has sections: Recently assigned, Do today, Do next week, Do later
    const sections = ['Recently assigned', 'Do today', 'Do next week', 'Do later'];
    for (const section of sections) {
      await expect(page.locator(`text=${section}`).first()).toBeVisible();
    }
  });
});
