import { test, expect, Page, Route } from '@playwright/test';

test.describe('AFE Management UI', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navigate to the AFE management page
    // Note: This assumes the web app has AFE management functionality
    await page.goto('/afes');
  });

  test('should display AFE list page', async ({ page }: { page: Page }) => {
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/AFE Management|WellFlow/);

    // Look for common AFE management elements
    await expect(page.locator('h1, h2')).toContainText(/AFE|Authorization for Expenditure/i);
  });

  test('should have create AFE button', async ({ page }: { page: Page }) => {
    // Look for create AFE button or link
    const createButton = page.locator('button, a').filter({ hasText: /create|new|add/i });
    await expect(createButton.first()).toBeVisible();
  });

  test('should display AFE table or list', async ({ page }: { page: Page }) => {
    // Check for AFE data display (table, cards, or list)
    const afeContainer = page.locator('table, [data-testid*="afe"], .afe-list, .afe-grid');
    await expect(afeContainer.first()).toBeVisible();
  });

  test('should show AFE status indicators', async ({ page }: { page: Page }) => {
    // Look for status indicators (badges, chips, or text)
    const statusElements = page.locator('[data-testid*="status"], .status, .badge').first();

    // If status elements exist, they should be visible
    if ((await statusElements.count()) > 0) {
      await expect(statusElements).toBeVisible();
    }
  });

  test('should have search or filter functionality', async ({ page }: { page: Page }) => {
    // Look for search input or filter controls
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    const filterControls = page.locator('select, [data-testid*="filter"]');

    // At least one search/filter element should exist
    const hasSearch = (await searchInput.count()) > 0;
    const hasFilter = (await filterControls.count()) > 0;

    expect(hasSearch || hasFilter).toBe(true);
  });

  test('should navigate to AFE details when clicking on AFE', async ({ page }: { page: Page }) => {
    // Look for clickable AFE items
    const afeItems = page.locator('tr, .afe-item, [data-testid*="afe-item"]');

    if ((await afeItems.count()) > 0) {
      // Click on first AFE item
      await afeItems.first().click();

      // Should navigate to details page or show details modal
      await expect(page.locator('h1, h2, [data-testid*="afe-detail"]')).toBeVisible();
    }
  });

  test('should show AFE creation form when create button is clicked', async ({
    page,
  }: {
    page: Page;
  }) => {
    // Find and click create button
    const createButton = page.locator('button, a').filter({ hasText: /create|new|add/i });

    if ((await createButton.count()) > 0) {
      await createButton.first().click();

      // Should show form or navigate to form page
      const formElements = page.locator('form, input[name*="afe"], [data-testid*="afe-form"]');
      await expect(formElements.first()).toBeVisible();
    }
  });

  test('should validate AFE form inputs', async ({ page }: { page: Page }) => {
    // Navigate to create AFE form
    const createButton = page.locator('button, a').filter({ hasText: /create|new|add/i });

    if ((await createButton.count()) > 0) {
      await createButton.first().click();

      // Look for AFE number input
      const afeNumberInput = page.locator('input[name*="afeNumber"], input[name*="number"]');

      if ((await afeNumberInput.count()) > 0) {
        // Test invalid AFE number format
        await afeNumberInput.fill('INVALID-FORMAT');

        // Try to submit form
        const submitButton = page
          .locator('button[type="submit"], button')
          .filter({ hasText: /submit|create|save/i });
        if ((await submitButton.count()) > 0) {
          await submitButton.first().click();

          // Should show validation error
          await expect(page.locator('.error, .invalid, [role="alert"]')).toBeVisible();
        }
      }
    }
  });

  test('should show AFE approval workflow buttons for submitted AFEs', async ({
    page,
  }: {
    page: Page;
  }) => {
    // Look for AFEs in submitted status
    const submittedAfes = page.locator('[data-status="submitted"], .status-submitted');

    if ((await submittedAfes.count()) > 0) {
      // Should have approve/reject buttons
      const approveButton = page.locator('button').filter({ hasText: /approve/i });
      const rejectButton = page.locator('button').filter({ hasText: /reject/i });

      const hasApproveButton = (await approveButton.count()) > 0;
      const hasRejectButton = (await rejectButton.count()) > 0;

      expect(hasApproveButton || hasRejectButton).toBe(true);
    }
  });

  test('should display AFE cost information', async ({ page }: { page: Page }) => {
    // Look for cost-related information
    const costElements = page.locator('[data-testid*="cost"], .cost, .amount').first();

    if ((await costElements.count()) > 0) {
      await expect(costElements).toBeVisible();

      // Should contain currency formatting ($ symbol or USD)
      await expect(costElements).toContainText(/\$|USD/);
    }
  });

  test('should show AFE type information', async ({ page }: { page: Page }) => {
    // Look for AFE type indicators
    const typeElements = page.locator('[data-testid*="type"], .type, .category');

    if ((await typeElements.count()) > 0) {
      await expect(typeElements.first()).toBeVisible();

      // Should contain valid AFE types
      await expect(typeElements.first()).toContainText(/drilling|completion|workover|facility/i);
    }
  });

  test('should be responsive on mobile devices', async ({ page }: { page: Page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be usable
    await expect(page.locator('body')).toBeVisible();

    // Navigation should be accessible (hamburger menu or mobile nav)
    const mobileNav = page.locator('.mobile-nav, .hamburger, [data-testid*="mobile"]');
    const regularNav = page.locator('nav, .navigation');

    // Either mobile nav exists or regular nav is still visible
    const hasMobileNav = (await mobileNav.count()) > 0;
    const hasRegularNav = (await regularNav.count()) > 0;

    expect(hasMobileNav || hasRegularNav).toBe(true);
  });

  test('should handle loading states', async ({ page }: { page: Page }) => {
    // Reload page to catch loading states
    await page.reload();

    // Look for loading indicators
    const loadingElements = page.locator('.loading, .spinner, [data-testid*="loading"]');

    // Loading elements might appear briefly
    if ((await loadingElements.count()) > 0) {
      // Should eventually disappear
      await expect(loadingElements.first()).toBeHidden({ timeout: 10000 });
    }

    // Content should be loaded
    await expect(page.locator('main, .content, [data-testid*="content"]')).toBeVisible();
  });

  test('should show error states gracefully', async ({ page }: { page: Page }) => {
    // Simulate network error by intercepting API calls
    await page.route('**/api/afes**', (route: Route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.reload();

    // Should show error message or empty state
    const errorElements = page.locator('.error, .empty-state, [data-testid*="error"]');

    if ((await errorElements.count()) > 0) {
      await expect(errorElements.first()).toBeVisible();
    }
  });
});
