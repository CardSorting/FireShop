import { test, expect } from '@playwright/test';

test.describe('Comprehensive Cart and Checkout Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    // Default Auth Mock (Null user)
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
    });

    // Mock Shipping Config
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

    // Mock Taxonomy/Categories
    await page.route('/api/taxonomy/categories', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'c1', name: 'TCG', slug: 'tcg' }])
        });
    });

    // Mock Products
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

  // Helper to open cart drawer reliably
  const openCart = async (page: any) => {
    const cartBtn = page.locator('button[aria-label="Open cart"]').filter({ visible: true });
    await cartBtn.first().click({ force: true });
    await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  };

  test('should show empty cart state and handle basic operations', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('h2', { hasText: /Your cart is empty/i })).toBeVisible();
    
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    
    await firstProduct.hover();
    await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
    
    await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
    const minusBtn = cartItem.locator('button:has(svg.lucide-minus)');
    
    await plusBtn.click({ force: true });
    await expect(cartItem.locator('span').filter({ hasText: '2' }).first()).toBeVisible();
    await minusBtn.click({ force: true });
    await expect(cartItem.locator('span').filter({ hasText: '1' }).first()).toBeVisible();
    
    await cartItem.locator('button[title="Remove item"]').click({ force: true });
    await expect(page.locator('text=/Your cart is empty/i').first()).toBeVisible();
  });

  test('should validate checkout fields and preserve data between steps', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'user-123', email: 'tester@example.com', displayName: 'Test User', role: 'customer' })
      });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-123',
          userId: 'user-123',
          items: [{ productId: 'p1', name: 'Test Product', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }],
          updatedAt: new Date().toISOString()
        })
      });
    });

    await page.goto('/checkout');
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible({ timeout: 15000 });

    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.locator('text=/Enter the street address/i')).toBeVisible();

    await page.locator('#checkout-street').fill('123 Test St');
    await page.locator('#checkout-city').fill('Test City');
    await page.locator('#checkout-state').fill('TS');
    await page.locator('#checkout-zip').fill('12345');
    
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
    await expect(page.locator('text=/Delivery Speed/i')).toBeVisible();

    await page.locator('button:has-text("Edit Address")').click({ force: true });
    await expect(page.locator('#checkout-street')).toHaveValue('123 Test St');
  });

  test('should handle discount codes correctly', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 't@e.com', role: 'customer' }) });
    });
    
    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-123',
          userId: 'u1',
          items: [{ productId: 'p1', name: 'Item', priceSnapshot: 10000, quantity: 1, imageUrl: '...' }],
          updatedAt: new Date().toISOString()
        })
      });
    });

    await page.route('/api/discounts/validate', async (route) => {
      const { code } = route.request().postDataJSON();
      if (code === 'VALID10') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } })
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, message: 'Invalid code' }) });
      }
    });

    await page.goto('/checkout');
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible({ timeout: 15000 });
    
    const discountInput = page.locator('input[placeholder="Discount code"]');
    await discountInput.fill('VALID10');
    await page.locator('button:has-text("Apply")').click({ force: true });
    await expect(page.locator('text=/VALID10 applied/i')).toBeVisible();
    await expect(page.locator('text=-$10.00').last()).toBeVisible();
  });

  test('should display free shipping milestone correctly', async ({ page }) => {
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    
    await firstProduct.hover();
    await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
    
    await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=/Shipping Progress/i')).toBeVisible();
    await expect(page.locator('text=$50.00 to go')).toBeVisible();
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await cartItem.locator('button:has(svg.lucide-plus)').click({ force: true });
    
    await expect(page.locator('text=/Free Shipping Unlocked/i')).toBeVisible();
  });

  test('should complete a successful order journey', async ({ page }) => {
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com', displayName: 'Test User', role: 'customer' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-123',
          userId: 'u1',
          items: [{ productId: 'p1', name: 'Black Lotus', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }],
          updatedAt: new Date().toISOString()
        })
      });
    });

    await page.route('/api/orders', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'ord-999',
            userId: 'u1',
            status: 'confirmed',
            total: 5599,
            items: [{ productId: 'p1', name: 'Black Lotus', unitPrice: 5000, quantity: 1 }],
            shippingAddress: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345', country: 'US' },
            createdAt: new Date().toISOString()
          })
        });
      }
    });

    await page.goto('/checkout');
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible();

    await page.locator('#checkout-street').fill('123 Test St');
    await page.locator('#checkout-city').fill('Test City');
    await page.locator('#checkout-state').fill('TS');
    await page.locator('#checkout-zip').fill('12345');
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });

    await expect(page.locator('text=/Standard Shipping/i').first()).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="continue-to-payment"]').click({ force: true });

    await expect(page.locator('text=/Payment Method/i')).toBeVisible({ timeout: 10000 });
    const paymentBtn = page.locator('[data-testid="mock-checkout-button"]');
    await paymentBtn.click({ force: true });

    await expect(page.locator('text=/Thank you/i')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('text=ORD-999')).toBeVisible();
  });

  test('should handle product variants in cart and checkout', async ({ page }) => {
    // Mock user for this test to ensure it fetches the mocked cart API
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'v@e.com', role: 'customer' }) });
    });

    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'cart-v1',
          userId: 'u1',
          items: [{ productId: 'p1', variantId: 'v2', variantTitle: 'Holographic', name: 'Black Lotus', priceSnapshot: 7500, quantity: 1, imageUrl: '...' }],
          updatedAt: new Date().toISOString()
        })
      });
    });

    await page.goto('/products');
    await openCart(page);
    
    const cartItem = page.locator('[data-testid="cart-item"]').first();
    await expect(cartItem).toContainText('Holographic', { timeout: 15000 });
    await expect(cartItem).toContainText('$75.00');

    await page.goto('/checkout');
    await expect(page.locator('text=/Holographic/i').last()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/$75.00/i').last()).toBeVisible();
  });

  test('should persist guest cart after page reload', async ({ page }) => {
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.hover();
    await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
    
    await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });

    await page.reload();
    await openCart(page);
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1, { timeout: 15000 });
  });

  test('should enforce maximum quantity limits', async ({ page }) => {
    // Use authenticated user to ensure cart is fetched from API
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'q@e.com', role: 'customer' }) });
    });

    await page.route('/api/cart', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'cart-qty',
            userId: 'u1',
            items: [{ productId: 'p1', name: 'Item', priceSnapshot: 1000, quantity: 9, imageUrl: '...' }],
            updatedAt: new Date().toISOString()
          })
        });
      });

    await page.goto('/products');
    await openCart(page);

    const cartItem = page.locator('[data-testid="cart-item"]').first();
    const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
    
    await plusBtn.click({ force: true });
    await expect(cartItem.locator('span').filter({ hasText: '10' }).first()).toBeVisible({ timeout: 10000 });
    await expect(plusBtn).toBeDisabled();
  });

});
