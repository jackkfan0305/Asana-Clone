import { test, expect, login } from './auth.setup';

test.describe('Tier 2 Stub Pages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Project Overview page renders', async ({ page }) => {
    await page.goto('/project/p1/overview');
    await expect(page.locator('text=/Overview|Project description|AI Summary|Activity/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Workflow page renders', async ({ page }) => {
    await page.goto('/project/p1/workflow');
    await expect(page.locator('text=/Workflow|tasks be added|automation/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Workload page renders', async ({ page }) => {
    await page.goto('/workload');
    await expect(page.locator('text=/Workload|Resource|Capacity/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Reporting page renders', async ({ page }) => {
    await page.goto('/reporting');
    await expect(page.locator('text=/Reporting|Report|Charts/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Forms page renders', async ({ page }) => {
    await page.goto('/forms');
    await expect(page.locator('text=/Forms|Form/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Templates page renders', async ({ page }) => {
    await page.goto('/templates');
    await expect(page.locator('text=/Templates|Template/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('Project calendar view renders', async ({ page }) => {
    await page.goto('/project/p1/calendar');
    await expect(page.locator('text=/Sun|Mon|Tue/').first()).toBeVisible({ timeout: 5_000 });
  });
});
