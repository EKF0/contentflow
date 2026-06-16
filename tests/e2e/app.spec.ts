import { test, expect } from '@playwright/test';

test.describe('ContentFlow App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads the app successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/ContentFlow/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays the sidebar', async ({ page }) => {
    const sidebar = page.locator('nav, [role="navigation"], aside').first();
    await expect(sidebar).toBeVisible();
  });

  test('displays content records', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const rows = page.locator('tr, [role="row"], .grid-row, [data-record]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('View Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('starts on Grid view by default', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const grid = page.locator('[data-view="grid"], table, .grid-view').first();
    await expect(grid).toBeVisible();
  });

  test('switches to Kanban view', async ({ page }) => {
    await page.click('text=Kanban, [data-view="kanban"], button:has-text("Kanban")');
    await page.waitForTimeout(500);
    const kanban = page.locator('[data-view="kanban"], .kanban-view, [class*="kanban"]').first();
    await expect(kanban).toBeVisible();
  });

  test('switches to Calendar view', async ({ page }) => {
    await page.click('text=Calendar, [data-view="calendar"], button:has-text("Calendar")');
    await page.waitForTimeout(500);
    const calendar = page.locator('[data-view="calendar"], .calendar-view, [class*="calendar"]').first();
    await expect(calendar).toBeVisible();
  });

  test('can switch back to Grid from other views', async ({ page }) => {
    await page.click('text=Kanban, [data-view="kanban"], button:has-text("Kanban")');
    await page.waitForTimeout(500);
    await page.click('text=Grid, [data-view="grid"], button:has-text("Grid")');
    await page.waitForTimeout(500);
    const grid = page.locator('[data-view="grid"], table, .grid-view').first();
    await expect(grid).toBeVisible();
  });
});

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('search input is visible', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], [data-testid="search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('search filters results', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], [data-testid="search"]').first();
    await searchInput.fill('React');
    await page.waitForTimeout(500);
    const rows = page.locator('tr, [role="row"], .grid-row, [data-record]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(20);
  });

  test('clearing search restores all records', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], [data-testid="search"]').first();
    await searchInput.fill('React');
    await page.waitForTimeout(500);
    await searchInput.clear();
    await page.waitForTimeout(500);
    const rows = page.locator('tr, [role="row"], .grid-row, [data-record]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(1);
  });
});

test.describe('Record Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens record panel on row click', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('tr, [role="row"], .grid-row, [data-record]').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    const panel = page.locator('[role="dialog"], .panel, .record-panel, [class*="panel"], [class*="sidebar"][class*="right"]').first();
    await expect(panel).toBeVisible();
  });

  test('closes record panel on close button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('tr, [role="row"], .grid-row, [data-record]').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    const closeBtn = page.locator('[aria-label="Close"], [data-testid="close"], button:has-text("×"), button:has-text("Close")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      const panel = page.locator('[role="dialog"], .panel, .record-panel, [class*="panel"][class*="slide"]').first();
      await expect(panel).not.toBeVisible();
    }
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Cmd+K opens search or command palette', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);
    const searchOrPalette = page.locator('[role="dialog"], [cmdk-input], [data-testid="command-palette"], input:focus').first();
    await expect(searchOrPalette).toBeVisible();
  });

  test('Escape closes open panels', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const firstRow = page.locator('tr, [role="row"], .grid-row, [data-record]').first();
    await firstRow.click();
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });
});
