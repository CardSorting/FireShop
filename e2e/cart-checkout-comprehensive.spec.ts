import { test, expect, Page } from '@playwright/test';

/**
 * [TEST SUITE: Comprehensive Commerce Flow]
 * Objective: Guarantee deterministic checkout behavior across all edge cases.
 */

test.describe('Comprehensive Cart and Checkout Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Reset state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // 2. Global Mocks (Base Layer)
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

    await page.route('/api/taxonomy/categories', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'c1', name: 'TCG', slug: 'tcg' }])
        });
    });

    await page.route('/api/products*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                products: [
                    {
                        id: 'p1',
                        name: 'Black Lotus',
                        handle: 'black-lotus',
                        price: 5000,
                        imageUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400',
                        stock: 10,
                        category: 'TCG',
                        hasVariants: true,
                        options: [{ id: 'opt1', name: 'Finish', position: 1, values: ['Normal', 'Holographic'] }],
                        variants: [
                          { id: 'v1', productId: 'p1', title: 'Normal', price: 5000, stock: 10, option1: 'Normal' },
                          { id: 'v2', productId: 'p1', title: 'Holographic', price: 7500, stock: 5, option1: 'Holographic' }
                        ]
                    }
                ],
                nextCursor: null
            })
        });
    });
  });

  // --- REUSABLE HELPERS ---

  async function openCart(page: Page) {
    // Wait for any potential hydration to finish
    await page.waitForLoadState('networkidle');
    const cartBtn = page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first();
    await expect(cartBtn).toBeVisible({ timeout: 15000 });
    await cartBtn.click({ force: true });
    // Verify drawer is actually open by checking for header
    await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  }

  async function addItemToCart(page: Page) {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    await firstProduct.hover();
    await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
    await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  }

  // --- TEST SCENARIOS ---

  test('should handle complete cart lifecycle as guest', async ({ page }) => {
    // 1. Initial Empty State
    await page.goto('/cart');
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible();

    // 2. Add and Verify
    await addItemToCart(page);
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem).toBeVisible({ timeout: 10000 });
    await expect(cartItem).toContainText('Black Lotus');

    // 3. Quantity Operations
    const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
    const minusBtn = cartItem.locator('button:has(svg.lucide-minus)');
    
    await plusBtn.click({ force: true });
    await expect(cartItem.getByText('2')).toBeVisible({ timeout: 10000 });
    
    await minusBtn.click({ force: true });
    await expect(cartItem.getByText('1')).toBeVisible({ timeout: 10000 });

    // 4. Persistence Check
    await page.reload();
    await openCart(page);
    // Wait for the item to be visible after hydration
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // 5. Cleanup
    await page.locator('[data-testid="cart-item"]').first().locator('button[title="Remove item"]').click({ force: true });
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible({ timeout: 10000 });
  });

  test('should calculate free shipping threshold milestones correctly', async ({ page }) => {
    await addItemToCart(page);
    
    // Check initial state ($50 item, $100 threshold)
    await expect(page.getByText(/Shipping Progress/i)).toBeVisible();
    // Using explicit string for visibility
    await expect(page.getByText('$50.00 to go')).toBeVisible();
    
    // Increase quantity to reach threshold
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await cartItem.locator('button:has(svg.lucide-plus)').click({ force: true });
    
    await expect(page.getByText(/Free Shipping Unlocked/i)).toBeVisible({ timeout: 10000 });
  });

  test('should validate checkout form and handle step transitions', async ({ page }) => {
    // Authenticated user
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'c1', userId: 'u1', items: [{ productId: 'p1', name: 'Art Print', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]
        })
      });
    });

    await page.goto('/checkout');
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible({ timeout: 15000 });

    // Step 1: Validation
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.getByText(/Enter the street address/i)).toBeVisible();

    // Step 2: Fulfillment info
    await page.locator('#checkout-street').fill('123 Hive St');
    await page.locator('#checkout-city').fill('New York');
    await page.locator('#checkout-state').fill('NY');
    await page.locator('#checkout-zip').fill('10001');
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });

    // Step 3: Shipping method
    await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Standard Shipping/i).first()).toBeVisible();
    await page.locator('[data-testid="continue-to-payment"]').click({ force: true });

    // Step 4: Payment Summary
    await expect(page.getByText(/Secure Payment/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/123 Hive St/i)).toBeVisible();
  });

  test('should handle discount codes and reflect them in total', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com' }) });
    });
    
    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'c1', items: [{ productId: 'p1', name: 'Item', priceSnapshot: 10000, quantity: 1, imageUrl: '...' }]
        })
      });
    });

    await page.route('/api/discounts/validate', async (route) => {
      const { code } = route.request().postDataJSON();
      if (code === 'SAVE20') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, discountAmount: 2000, discount: { type: 'fixed_amount', value: 2000 } })
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, message: 'Invalid code' }) });
      }
    });

    await page.goto('/checkout');
    const discountInput = page.locator('input[placeholder="Discount code"]');
    await discountInput.fill('SAVE20');
    await page.getByRole('button', { name: /Apply/i }).click({ force: true });

    await expect(page.getByText(/SAVE20 applied/i)).toBeVisible({ timeout: 10000 });
    // Use exact string to avoid regex escaping issues
    await expect(page.getByText('-$20.00')).toBeVisible({ timeout: 10000 });
  });

  test('should execute a successful order journey to confirmation', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com', displayName: 'Collector' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'c1', items: [{ productId: 'p1', name: 'Masterpiece', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]
        })
      });
    });

    await page.route('/api/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'ord-confirm-777',
            status: 'confirmed',
            total: 5599,
            items: [{ productId: 'p1', name: 'Masterpiece', unitPrice: 5000, quantity: 1 }],
            shippingAddress: { street: '123 Hive St', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
            createdAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('/checkout');
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible();
    
    // Fill all required fields including email
    await page.locator('#checkout-email').fill('tester@example.com');
    await page.locator('#checkout-street').fill('123 Hive St');
    await page.locator('#checkout-city').fill('NY');
    await page.locator('#checkout-state').fill('NY');
    await page.locator('#checkout-zip').fill('10001');
    
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    
    // Wait for transition to shipping
    await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="continue-to-payment"]').click({ force: true });

    // Finalize
    const finalizeBtn = page.locator('[data-testid="mock-checkout-button"]');
    await expect(finalizeBtn).toBeVisible({ timeout: 20000 });
    await finalizeBtn.click({ force: true });

    // Success check
    await expect(page.getByText(/Thank you for your order/i)).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/ORD-CONFIRM-777/i)).toBeVisible();
  });

  test('should handle variant selection and correct pricing in cart', async ({ page }) => {
    // Authenticated for predictable cart fetching
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'v@e.com' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-v1',
          userId: 'u1',
          items: [{ 
            productId: 'p1', 
            variantId: 'v2', 
            variantTitle: 'Holographic', 
            name: 'Black Lotus', 
            priceSnapshot: 7500, 
            quantity: 1, 
            imageUrl: '...' 
          }]
        })
      });
    });

    await page.goto('/products');
    await openCart(page);
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem).toContainText('Holographic', { timeout: 15000 });
    await expect(cartItem).toContainText('$75.00');

    // Verify in checkout summary
    await page.goto('/checkout');
    await expect(page.locator('aside').getByText(/Holographic/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('aside').getByText('75.00').last()).toBeVisible();
  });

  test('should skip shipping step for purely digital orders', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'd@e.com' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-digital',
          items: [{ productId: 'p1', name: 'Digital Art', priceSnapshot: 2500, quantity: 1, isDigital: true, imageUrl: '...' }]
        })
      });
    });

    await page.goto('/checkout');
    
    // Fill identity (email)
    await page.locator('#checkout-email').fill('d@e.com');
    
    // Click continue - should go straight to payment because it's digital
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    
    await expect(page.getByText(/Secure Payment/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Instant digital fulfillment/i)).toBeVisible();
    
    // Verify shipping step is not in the stepper
    await expect(page.locator('text=/Delivery Speed/i')).not.toBeVisible();
  });

  test('should enforce max quantity limits reliably', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'limit@e.com' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-qty',
          userId: 'u1',
          items: [{ productId: 'p1', name: 'Limited Edition', priceSnapshot: 1000, quantity: 9, imageUrl: '...' }]
        })
      });
    });

    await page.goto('/products');
    await openCart(page);

    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
    
    // Increment to 10
    await plusBtn.click({ force: true });
    await expect(cartItem.getByText('10')).toBeVisible({ timeout: 15000 });

    // Verify disabled
    await expect(plusBtn).toBeDisabled({ timeout: 10000 });
  });

});
