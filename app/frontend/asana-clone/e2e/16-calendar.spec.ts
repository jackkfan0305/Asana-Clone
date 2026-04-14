import { test, expect, login } from './auth.setup';

test.describe('Due Dates & Calendar View', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/calendar');
  });

  test('displays calendar grid', async ({ page }) => {
    // Calendar should show day headers
    await expect(page.locator('text=Sun').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Mon').first()).toBeVisible();
    await expect(page.locator('text=Tue').first()).toBeVisible();
    await expect(page.locator('text=Wed').first()).toBeVisible();
    await expect(page.locator('text=Thu').first()).toBeVisible();
    await expect(page.locator('text=Fri').first()).toBeVisible();
    await expect(page.locator('text=Sat').first()).toBeVisible();
  });

  test('shows month navigation', async ({ page }) => {
    await expect(page.locator('text=Today').first()).toBeVisible({ timeout: 5_000 });
    // Previous and next month buttons
    await expect(page.locator('text=◀').or(page.locator('text=◄')).first()).toBeVisible();
    await expect(page.locator('text=▶').or(page.locator('text=►')).first()).toBeVisible();
  });

  test('displays current month name', async ({ page }) => {
    // Should show a month name like "April 2026"
    await expect(page.locator('text=/\\w+ \\d{4}/').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows tasks on calendar days', async ({ page }) => {
    // Tasks with due dates should appear on calendar cells
    await page.waitForTimeout(1000);
    // Look for any task text on the calendar
    const taskOnCal = page.locator('text=/Design|Implement|Create|Build|Write|Setup|Review/i').first();
    await expect(taskOnCal).toBeVisible({ timeout: 5_000 });
  });

  test('can navigate to next month', async ({ page }) => {
    const monthLabel = page.locator('text=/\\w+ \\d{4}/').first();
    const initialMonth = await monthLabel.textContent();
    await page.locator('text=▶').or(page.locator('text=►')).first().click();
    await page.waitForTimeout(300);
    const newMonth = await monthLabel.textContent();
    expect(newMonth).not.toBe(initialMonth);
  });
});
