import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display hero content', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check for hero heading
    await expect(page.getByText(/Art You Can/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Collect & Hold/i)).toBeVisible({ timeout: 10000 });
    
    // Check for "Shop All Art" button
    const shopBtn = page.getByRole('link', { name: /Shop All Art/i }).first();
    await expect(shopBtn).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const shopBtn = page.getByRole('link', { name: /Shop All Art/i }).first();
    await shopBtn.click();

    // Check URL
    await expect(page).toHaveURL(/\/products/);
  });
});
