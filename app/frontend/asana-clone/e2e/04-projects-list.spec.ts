import { test, expect, login } from './auth.setup';

test.describe('Projects List Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/projects');
  });

  test('displays Projects heading', async ({ page }) => {
    await expect(page.locator('h1:has-text("Projects")').first()).toBeVisible({ timeout: 5_000 });
  });

  test('lists seed projects', async ({ page }) => {
    await expect(page.locator('text=Website Redesign').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Mobile App v2').first()).toBeVisible();
  });

  test('shows project status indicators', async ({ page }) => {
    // Projects show status: On Track, At Risk, Off Track
    await expect(page.locator('text=/On Track|At Risk|Off Track/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('shows New Project button', async ({ page }) => {
    await expect(page.locator('text=/New Project/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can navigate to a project', async ({ page }) => {
    await page.locator('text=Website Redesign').first().click();
    await page.waitForURL('**/project/**');
    expect(page.url()).toContain('/project/');
  });

  test('shows all six seed projects', async ({ page }) => {
    const projectNames = ['Website Redesign', 'Mobile App v2', 'Brand Guidelines', 'Q2 Marketing Campaign', 'API Platform', 'Design System'];
    for (const name of projectNames) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 5_000 });
    }
  });
});
