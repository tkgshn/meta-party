import { test, expect } from '@playwright/test';

test.describe('Header Play Token Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display demo logo', async ({ page }) => {
    await expect(page.locator('h1:has-text("demo")')).toBeVisible();
  });

  test('should show wallet connect button when not connected', async ({ page }) => {
    await expect(page.locator('button:has-text("ウォレット接続")')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="市場を検索..."]');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('test market');
    await expect(searchInput).toHaveValue('test market');
  });

  test('should show about modal for non-connected users', async ({ page }) => {
    const aboutButton = page.locator('button:has-text("仕組みについて")');
    await expect(aboutButton).toBeVisible();
    
    await aboutButton.click();
    await expect(page.locator('text=予測市場で社会課題を解決')).toBeVisible();
  });

  test.describe('Connected State (Mock)', () => {
    test.beforeEach(async ({ page }) => {
      // Mock wallet connection by navigating to test page
      await page.goto('/test-header');
    });

    test('should display test page with checklist', async ({ page }) => {
      await expect(page.locator('h1:has-text("Header Component Test Page")')).toBeVisible();
      await expect(page.locator('text=Portfolio & Cash Display (PT Symbol)')).toBeVisible();
    });

    test('should have all test scenarios listed', async ({ page }) => {
      await expect(page.locator('text=Scenario 1: New User Flow')).toBeVisible();
      await expect(page.locator('text=Scenario 2: Existing User')).toBeVisible();
      await expect(page.locator('text=Scenario 3: Network Switching')).toBeVisible();
    });

    test('should log search queries', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="市場を検索..."]');
      await searchInput.fill('test query');
      await searchInput.press('Enter');
      
      // Check if log contains the search query
      const logSection = page.locator('.font-mono');
      await expect(logSection).toContainText('Search query: "test query"');
    });
  });
});

test.describe('Visual Regression Tests', () => {
  test('header desktop view', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Take screenshot of header
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    // Optional: Add visual regression testing
    // await expect(header).toHaveScreenshot('header-desktop.png');
  });

  test('header mobile view', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile search is hidden initially
    const desktopSearch = page.locator('.hidden.md\\:flex input[placeholder="市場を検索..."]');
    await expect(desktopSearch).not.toBeVisible();
    
    // Check mobile search is visible
    const mobileSearch = page.locator('.md\\:hidden input[placeholder="市場を検索..."]');
    await expect(mobileSearch).toBeVisible();
  });
});

test.describe('Network-specific Features', () => {
  test('should check PT symbol consistency', async ({ page }) => {
    await page.goto('/test-header');
    
    // Verify PT is the expected currency
    const expectedCurrency = page.locator('text=Expected Currency').locator('..').locator('.font-medium');
    await expect(expectedCurrency).toContainText('PT (Play Token)');
  });

  test('should list supported networks', async ({ page }) => {
    await page.goto('/test-header');
    
    const supportedNetworks = page.locator('text=Supported Networks').locator('..').locator('.font-medium');
    await expect(supportedNetworks).toContainText('Polygon Amoy, Sepolia');
  });
});