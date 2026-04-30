import { test, expect } from '@playwright/test';

test.describe('Shopping Cart E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Start on the products page for all tests
    await page.goto('/products');
  });

  test('should handle basic cart operations in the drawer', async ({ page }) => {
    // 1. Add two different products
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });

    const firstProductName = await productCards.nth(0).locator('h3').textContent();
    const secondProductName = await productCards.nth(1).locator('h3').textContent();

    // Click "Quick Add" on first product
    await productCards.nth(0).getByRole('button', { name: /Quick Add/i }).click();
    
    // Verify cart drawer opens
    const cartDrawer = page.locator('h2', { hasText: /Your Shopping Cart/i });
    await expect(cartDrawer).toBeVisible();
    
    // Close drawer to add another one
    await page.getByLabel('Close cart drawer').click();
    await expect(cartDrawer).not.toBeVisible();

    // Click "Quick Add" on second product
    await productCards.nth(1).getByRole('button', { name: /Quick Add/i }).click();
    await expect(cartDrawer).toBeVisible();

    // 2. Verify both items are in the drawer (specifically in the cart-item list)
    if (firstProductName && secondProductName) {
      await expect(page.locator('[data-testid="cart-item"]').filter({ hasText: firstProductName.trim() })).toBeVisible();
      await expect(page.locator('[data-testid="cart-item"]').filter({ hasText: secondProductName.trim() })).toBeVisible();
    }

    // 3. Update quantity of the first item
    const firstItemInCart = page.locator('[data-testid="cart-item"]').filter({ hasText: firstProductName?.trim() || '' });
    const plusButton = firstItemInCart.locator('button').filter({ has: page.locator('svg.lucide-plus') });
    const minusButton = firstItemInCart.locator('button').filter({ has: page.locator('svg.lucide-minus') });
    
    // Initial quantity 1
    await expect(firstItemInCart.locator('span').filter({ hasText: '1' }).first()).toBeVisible();
    
    // Increment to 2
    await plusButton.click();
    await expect(firstItemInCart.locator('span').filter({ hasText: '2' }).first()).toBeVisible();
    
    // Decrement back to 1
    await minusButton.click();
    await expect(firstItemInCart.locator('span').filter({ hasText: '1' }).first()).toBeVisible();

    // 4. Remove the second item
    const secondItemInCart = page.locator('[data-testid="cart-item"]').filter({ hasText: secondProductName?.trim() || '' });
    const removeButton = secondItemInCart.locator('button[title="Remove item"]');
    await removeButton.click();
    
    // Verify it's gone from the cart items
    if (secondProductName) {
      await expect(page.locator('[data-testid="cart-item"]').filter({ hasText: secondProductName.trim() })).not.toBeVisible();
    }
    // First item should still be there
    if (firstProductName) {
      await expect(page.locator('[data-testid="cart-item"]').filter({ hasText: firstProductName.trim() })).toBeVisible();
    }
  });

  test('should persist cart after page refresh and allow clearing', async ({ page }) => {
    // 1. Add an item
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
    const productName = await productCards.first().locator('h3').textContent();
    await productCards.first().getByRole('button', { name: /Quick Add/i }).click();
    
    // 2. Refresh the page
    await page.reload();
    
    // 3. Open cart and verify item is still there
    await page.getByLabel('Open cart').click();
    if (productName) {
      await expect(page.locator('[data-testid="cart-item"]').filter({ hasText: productName.trim() })).toBeVisible();
    }
    
    // 4. Go to cart page
    await page.getByRole('link', { name: /View & Edit Cart/i }).click();
    await expect(page).toHaveURL(/\/cart/);
    
    // 5. Clear all items
    await page.getByRole('button', { name: /Clear All Items/i }).click();
    
    // 6. Verify empty state
    await expect(page.locator('h2', { hasText: /Your cart is empty/i })).toBeVisible();
  });

  test('should show free shipping threshold and navigate to checkout', async ({ page }) => {
    // 1. Add multiple items until we reach a high total
    // Free shipping is at $100 (10000 cents)
    const productCards = page.locator('[data-testid="product-card"]');
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });

    // Click "Quick Add"
    await productCards.first().getByRole('button', { name: /Quick Add/i }).click();
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const plusButton = cartItem.locator('button').filter({ has: page.locator('svg.lucide-plus') });
    
    // Increase quantity to reach threshold (assuming price is reasonable, but let's just add 10)
    for(let i = 0; i < 10; i++) {
        await plusButton.click();
    }

    // Check for "unlocked FREE EXPRESS Shipping" text or similar indicator
    // In CartDrawer, it says "You've unlocked FREE EXPRESS Shipping!"
    await expect(page.locator('text=/unlocked/i')).toBeVisible();

    // 2. Proceed to checkout
    await page.getByRole('link', { name: /Checkout Securely/i }).click();
    await expect(page).toHaveURL(/\/checkout/);
    // Use the new test ID for the checkout header
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible();
  });
});
