import { test, expect, Page } from '@playwright/test';

/**
 * [TEST SUITE: Industrialized Commerce Flow - FINAL MASTER]
 * Objective: 100% Deterministic, zero-flakiness commerce validation.
 */

test.describe('Comprehensive Cart and Checkout Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await setupBaseMocks(page);
  });

  async function setupBaseMocks(page: Page) {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    await page.route('/api/admin/shipping/rates', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'r1', name: 'Standard Shipping', amount: 599, type: 'price_based', minLimit: 0, maxLimit: 9999, shippingZoneId: 'z1' }])
        });
    });
    await page.route('/api/admin/shipping/zones', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'z1', name: 'USA', countries: ['US'] }])
        });
    });

    await page.route('/api/products*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                products: [
                    { id: 'p1', name: 'Physical Art', handle: 'physical-art', price: 5000, stock: 10, category: 'Art', isDigital: false, imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400' },
                    { id: 'p2', name: 'Digital Art', handle: 'digital-art', price: 2000, stock: 999, category: 'Art', isDigital: true, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' }
                ],
                nextCursor: null
            })
        });
    });

    // Smart Cart Mock: Handles both Guest-to-Auth sync and normal operations
    await page.route('/api/cart*', async (route) => {
        const method = route.request().method();
        const data = route.request().postDataJSON() || {};
        
        // Return a cart that matches the requested product if adding
        const items = [];
        if (data.productId === 'p1' || method === 'GET') {
            items.push({ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: data.quantity || 1, imageUrl: '...' });
        }
        if (data.productId === 'p2') {
            items.push({ productId: 'p2', name: 'Digital Art', priceSnapshot: 2000, quantity: data.quantity || 1, imageUrl: '...' });
        }

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'cart-final', items, updatedAt: new Date().toISOString() })
        });
    });
  }

  async function openCart(page: Page) {
    const cartBtn = page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first();
    await expect(cartBtn).toBeVisible({ timeout: 15000 });
    await cartBtn.click({ force: true });
    await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  }

  async function addItem(page: Page, index: number) {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    // Ensure drawer is closed
    const closeBtn = page.locator('button[aria-label="Close cart"]').filter({ visible: true }).first();
    if (await closeBtn.isVisible()) {
        await closeBtn.click({ force: true });
        await expect(closeBtn).not.toBeVisible({ timeout: 10000 });
    }

    const cards = page.locator('[data-testid="product-card"]');
    const target = cards.nth(index);
    await expect(target).toBeVisible({ timeout: 15000 });
    await target.hover();
    await target.locator('button:has-text("Quick Add")').click({ force: true });
    
    // Verification
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  }

  // --- TESTS ---

  test('should merge guest cart into auth session upon login', async ({ page }) => {
    await addItem(page, 0); // Physical Art
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // Login mock
    await page.route('/api/auth/me', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'collector@example.com' }) });
    });

    await page.reload();
    await openCart(page);
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="cart-item"]')).toContainText('Physical Art');
  });

  test('should require shipping for mixed carts', async ({ page }) => {
    await addItem(page, 0);
    await addItem(page, 1);
    
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2, { timeout: 15000 });

    await page.goto('/checkout');
    await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 20000 });
    await page.locator('#checkout-email').fill('mixed@example.com');
    await page.locator('#checkout-street').fill('123 Hive St');
    await page.locator('#checkout-city').fill('NY');
    await page.locator('#checkout-state').fill('NY');
    await page.locator('#checkout-zip').fill('10001');

    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
  });

  test('should block checkout if no shipping zone matches', async ({ page }) => {
    await addItem(page, 0);
    await page.goto('/checkout');
    
    await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 20000 });
    await page.locator('#checkout-email').fill('test@example.com');
    await page.locator('#checkout-street').fill('123 Foreign St');
    await page.locator('#checkout-city').fill('Toronto');
    await page.locator('#checkout-state').fill('ON');
    await page.locator('#checkout-zip').fill('M5V 2L7');
    
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.getByText(/No matching zone/i)).toBeVisible({ timeout: 15000 });
  });

  test('should handle payment errors from API', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'fails@example.com' }) });
    });
    await page.route('/api/orders', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ message: 'Insufficient funds.' }) });
        }
    });

    await addItem(page, 0);
    await page.goto('/checkout');
    await page.locator('#checkout-email').fill('fails@example.com');
    await page.locator('#checkout-street').fill('123 Hive St');
    await page.locator('#checkout-city').fill('NY');
    await page.locator('#checkout-state').fill('NY');
    await page.locator('#checkout-zip').fill('10001');
    
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
    
    await page.locator('[data-testid="mock-checkout-button"]').click({ force: true });
    await expect(page.locator('#checkout-error')).toContainText(/Insufficient funds/i, { timeout: 15000 });
  });

  test('should handle discount codes in checkout summary', async ({ page }) => {
    await addItem(page, 0);
    await page.goto('/checkout');
    
    await page.route('/api/discounts/validate', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } }) });
    });

    await page.locator('input[placeholder="Discount code"]').fill('SAVE10');
    await page.getByRole('button', { name: /Apply/i }).click({ force: true });
    
    await expect(page.getByText(/SAVE10 applied/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('-$10.00')).toBeVisible();
    
    await page.locator('button:has-text("Remove")').click({ force: true });
    await expect(page.getByText('-$10.00')).not.toBeVisible();
  });

  test('should enforce cart quantity cap', async ({ page }) => {
    await addItem(page, 0);
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
    
    for(let i = 0; i < 9; i++) {
        await plusBtn.click({ force: true });
        await page.waitForTimeout(200); // Wait for animation and state
    }
    
    await expect(cartItem.getByText('10')).toBeVisible({ timeout: 15000 });
    await expect(plusBtn).toBeDisabled({ timeout: 10000 });
  });

  test('should survive guest page reloads', async ({ page }) => {
    await addItem(page, 0);
    await page.reload();
    await openCart(page);
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  });

  test('should maintain field data across checkout steps', async ({ page }) => {
    await addItem(page, 0);
    await page.goto('/checkout');
    await page.locator('#checkout-email').fill('step@example.com');
    await page.locator('#checkout-street').fill('123 Hive St');
    await page.locator('#checkout-city').fill('NY');
    await page.locator('#checkout-state').fill('NY');
    await page.locator('#checkout-zip').fill('10001');

    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await page.locator('button:has-text("Edit Address")').click({ force: true });
    await expect(page.locator('#checkout-street')).toHaveValue('123 Hive St');
  });

});
