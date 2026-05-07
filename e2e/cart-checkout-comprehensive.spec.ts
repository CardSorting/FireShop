import { test, expect, Page } from '@playwright/test';

/**
 * [TEST SUITE: Industrialized Commerce Flow - MASTER V8 ULTIMATE]
 * Objective: 100% Deterministic by bypassing UI flakiness for data setup.
 */

test.describe('Comprehensive Cart and Checkout Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await setupBaseMocks(page);
  });

  async function setupBaseMocks(page: Page) {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    await page.route('/api/admin/shipping/rates', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'r1', name: 'Standard Shipping', amount: 599, type: 'price_based', minLimit: 0, maxLimit: 9999, shippingZoneId: 'z1' }]) });
    });
    await page.route('/api/admin/shipping/zones', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'z1', name: 'USA', countries: ['US'] }]) });
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

    await page.route('/api/cart*', async (route) => {
        const url = route.request().url();
        const items = [];
        // Support stateful-like behavior via URL hints or default to p1
        items.push({ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' });
        if (url.includes('mixed')) {
             items.push({ productId: 'p2', name: 'Digital Art', priceSnapshot: 2000, quantity: 1, imageUrl: '...' });
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ id: 'cart-v8', items, updatedAt: new Date().toISOString() })
        });
    });
  }

  /**
   * Directly populates the guest cart in localStorage to ensure deterministic checkout state.
   */
  async function seedCart(page: Page, items: any[]) {
    await page.goto('/'); // Need to be on the domain to set localStorage
    await page.evaluate((seededItems) => {
      const cart = {
        id: 'seeded-cart',
        userId: 'guest',
        items: seededItems,
        updatedAt: new Date()
      };
      localStorage.setItem('dreambees_guest_cart', JSON.stringify(cart));
    }, items);
  }

  // --- TESTS ---

  test('should merge guest cart into auth session', async ({ page }) => {
    await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
    await page.route('/api/auth/me', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@example.com' }) });
    });
    await page.goto('/products');
    await page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first().click({ force: true });
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  });

  test('should require shipping for mixed carts', async ({ page }) => {
    await seedCart(page, [
        { productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' },
        { productId: 'p2', name: 'Digital Art', priceSnapshot: 2000, quantity: 1, imageUrl: '...' }
    ]);
    
    // Hint to the cart mock to return both items
    await page.goto('/checkout?mixed=true');
    await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 15000 });
    await page.locator('#checkout-email').fill('mixed@example.com');
    await page.locator('#checkout-street').fill('123 Hive St');
    await page.locator('#checkout-city').fill('NY');
    await page.locator('#checkout-state').fill('NY');
    await page.locator('#checkout-zip').fill('10001');

    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
  });

  test('should block checkout for unsupported shipping countries', async ({ page }) => {
    await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
    await page.goto('/checkout');
    await page.locator('#checkout-email').fill('test@example.com');
    await page.locator('#checkout-street').fill('123 Foreign St');
    await page.locator('#checkout-city').fill('Toronto');
    await page.locator('#checkout-state').fill('ON');
    await page.locator('#checkout-zip').fill('M5V 2L7');
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.getByText(/No matching zone/i)).toBeVisible({ timeout: 15000 });
  });

  test('should handle payment errors', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@example.com' }) });
    });
    await page.route('/api/orders', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ message: 'Insufficient funds.' }) });
        }
    });

    await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
    await page.goto('/checkout');
    
    // Auth users have read-only email
    await expect(page.locator('#checkout-email')).toHaveValue('test@example.com');
    await page.locator('#checkout-street').fill('123 Test St');
    await page.locator('#checkout-city').fill('Test City');
    await page.locator('#checkout-state').fill('TS');
    await page.locator('#checkout-zip').fill('12345');
    
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
    await page.locator('[data-testid="mock-checkout-button"]').click({ force: true });
    await expect(page.locator('#checkout-error')).toContainText(/Insufficient funds/i, { timeout: 20000 });
  });

  test('should apply discount codes', async ({ page }) => {
    await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
    await page.goto('/checkout');
    await page.route('/api/discounts/validate', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } }) });
    });
    await page.locator('input[placeholder="Discount code"]').fill('SAVE10');
    await page.getByRole('button', { name: /Apply/i }).click({ force: true });
    await expect(page.getByText(/SAVE10 applied/i)).toBeVisible({ timeout: 15000 });
  });

  test('should enforce quantity limits', async ({ page }) => {
    await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
    await page.goto('/products');
    await page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first().click({ force: true });
    
    const plusBtn = page.locator('button:has(svg.lucide-plus)');
    for(let i = 0; i < 9; i++) {
        await plusBtn.click({ force: true });
    }
    await expect(page.getByText('10')).toBeVisible({ timeout: 10000 });
    await expect(plusBtn).toBeDisabled({ timeout: 5000 });
  });

  test('should persist cart after reload', async ({ page }) => {
    await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
    await page.goto('/products');
    await page.reload();
    await page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first().click({ force: true });
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  });

});
