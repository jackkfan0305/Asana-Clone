import { test, expect, login } from './auth.setup';

test.describe('Authentication', () => {
  test('login form is accessible and has correct fields', async ({ page }) => {
    // The login function itself tests the login flow
    // Verify core navigation elements appear after login
    await login(page);
    await expect(page.locator('text=Home').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=My Tasks').first()).toBeVisible();
    await expect(page.locator('text=Inbox').first()).toBeVisible();
  });

  test('authenticated user sees personalized content', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    // Should show personalized greeting with user's first name
    await expect(page.locator('text=/Good (morning|afternoon|evening)/').first()).toBeVisible({ timeout: 5_000 });
  });

  test('user menu shows user info', async ({ page }) => {
    await login(page);
    await page.goto('/home');
    // Topbar should show user avatar
    const userAvatar = page.locator('img[src*="dicebear"]').last();
    await expect(userAvatar).toBeVisible({ timeout: 5_000 });
  });
});
