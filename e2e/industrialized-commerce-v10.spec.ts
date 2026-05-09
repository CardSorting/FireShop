import { test, expect, Page } from '@playwright/test';

/**
 * [LAYER: E2E]
 * 
 * Industrialized Commerce Spec V10 - FINAL HARDENED VERSION
 */

let state = { items: [] as any[] };

test.describe('Industrialized Commerce Suite V10', () => {

  async function setupSubstrateMocks(page: Page) {
    state = { items: [] as any[] };
    const nowIso = new Date().toISOString();
    
    const allProducts = [
      {
        id: 'p1', handle: 'physical-masterpiece', name: 'Physical Masterpiece',
        price: 15000, imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400',
        isDigital: false, stock: 50,
      },
      {
        id: 'p2', handle: 'digital-genesis', name: 'Digital Genesis',
        price: 2500, imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400',
        isDigital: true, stock: 9999,
      },
      {
        id: 'p3', handle: 'sold-out-artifact', name: 'Sold Out Artifact',
        price: 9900, imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400',
        isDigital: false, stock: 0,
      }
    ];

    const toCartItem = (productId: string, quantity: number): any => {
      const product = allProducts.find((item) => item.id === productId);
      if (!product) return null;
      return {
        productId: product.id, productHandle: product.handle, name: product.name,
        priceSnapshot: product.price, quantity, imageUrl: product.imageUrl, isDigital: product.isDigital,
      };
    };

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      const body = route.request().postDataJSON() || {};
      const searchParams = new URL(url).searchParams;

      // 1. AUTH
      if (url.includes('/api/auth/me')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
          id: 'u_v10', email: 'client@hive.art', displayName: 'Industrial Tester', role: 'customer', createdAt: nowIso
        }) });
      }

      // 2. PRODUCTS
      if (url.includes('/api/products')) {
        if (url.includes('/api/products/')) {
          const idOrHandle = url.split('/').pop()?.split('?')[0];
          const product = allProducts.find(p => p.id === idOrHandle || p.handle === idOrHandle);
          return product ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(product) }) : route.fulfill({ status: 404 });
        }
        const query = searchParams.get('query')?.toLowerCase();
        let products = allProducts;
        if (query) {
          products = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.handle.toLowerCase().includes(query));
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products }) });
      }

      // 3. CART
      if (url.includes('/api/cart')) {
        if (method === 'POST' && url.includes('/items')) {
          const existing = state.items.find(i => i.productId === body.productId && (i.variantId || undefined) === (body.variantId || undefined));
          if (existing) existing.quantity += (body.quantity ?? 1);
          else {
            const newItem = toCartItem(body.productId, body.quantity ?? 1);
            if (newItem) state.items.push(newItem);
          }
        } else if (method === 'PATCH' && url.includes('/items')) {
          const existing = state.items.find(i => i.productId === body.productId && (i.variantId || undefined) === (body.variantId || undefined));
          if (existing) existing.quantity = body.quantity;
        } else if (method === 'DELETE' && url.includes('/items')) {
          state.items = state.items.filter(i => !(i.productId === body.productId && (i.variantId || undefined) === (body.variantId || undefined)));
        } else if (method === 'DELETE') {
          state.items = [];
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'c1', userId: 'u_v10', items: [...state.items], updatedAt: nowIso }) });
      }

      // 4. DISCOUNTS
      if (url.includes('/api/discounts/validate')) {
        if (body.code === 'BEE10') {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1500, discount: { id: 'd1', code: 'BEE10', type: 'percentage', value: 10 } }) });
        }
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid code' }) });
      }

      // 5. ORDERS
      if (url.includes('/api/orders') && method === 'POST') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ORD_123', status: 'confirmed' }) });
      }

      // 6. DEFAULT (Catch-all for stability)
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    if (page.url() === 'about:blank') {
      await page.goto('/');
    }
    await page.evaluate(() => localStorage.clear());
  }

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await setupSubstrateMocks(page);
  });

  test('Full Life Cycle: Physical Product Purchase', async ({ page }) => {
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Physical Masterpiece' });
    await expect(firstProduct).toBeVisible({ timeout: 20000 });
    await firstProduct.hover();
    await firstProduct.getByTestId('quick-add').click();

    await expect(page.locator('h2', { hasText: /Cart/i })).toBeVisible({ timeout: 20000 });
    await page.getByRole('link', { name: /Checkout/i }).click();
    await page.getByTestId('cart-drawer').waitFor({ state: 'detached', timeout: 20000 });
    
    await page.waitForURL(/\/checkout/, { timeout: 20000 });
    await page.locator('#checkout-street').fill('777 Neon Blvd');
    await page.locator('#checkout-city').fill('Metropolis');
    await page.locator('#checkout-state').fill('CA');
    await page.locator('#checkout-zip').fill('90210');
    
    await page.getByRole('button', { name: /continue to shipping/i }).click();
    await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 20000 });
    
    await page.getByRole('button', { name: /continue to payment/i }).click();
    await expect(page.getByText(/Secure Payment/i)).toBeVisible({ timeout: 20000 });
    
    await page.locator('input[placeholder*="Discount"]').fill('BEE10');
    await page.getByRole('button', { name: /Apply/i }).click();
    await expect(page.getByText(/BEE10 applied/i)).toBeVisible({ timeout: 20000 });

    await page.getByTestId('mock-checkout-button').click();
    await expect(page.getByText(/Thank you/i)).toBeVisible({ timeout: 40000 });
  });

  test('Edge Case: Multi-Currency & Precision Formatting', async ({ page }) => {
    state.items = [
      { productId: 'p1', productHandle: 'physical-masterpiece', name: 'Physical Masterpiece', priceSnapshot: 15000, quantity: 2, imageUrl: '...', isDigital: false }
    ];
    
    await page.goto('/cart');
    await expect(page.getByTestId('cart-total')).toHaveText(/\$300\.00/, { timeout: 20000 });

    const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: 'Physical Masterpiece' });
    await cartItem.getByTestId('increase-quantity').click();
    
    await expect(cartItem.getByTestId('item-quantity')).toHaveText('3', { timeout: 20000 });
    await expect(page.getByTestId('cart-total')).toHaveText(/\$450\.00/, { timeout: 20000 });
  });

  test('Constraint Validation: Sold Out Product', async ({ page }) => {
    await page.goto('/products');
    const soldOutProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Sold Out Artifact' });
    await expect(soldOutProduct.getByTestId('sold-out-badge')).toBeVisible({ timeout: 20000 });
  });

  test('Digital Workflow: Instant Fulfillment', async ({ page }) => {
    state.items = [
      { productId: 'p2', productHandle: 'digital-genesis', name: 'Digital Genesis', priceSnapshot: 2500, quantity: 1, imageUrl: '...', isDigital: true }
    ];
    
    await page.goto('/checkout');
    await page.locator('#checkout-street').fill('Digital Way 1');
    await page.locator('#checkout-city').fill('CyberCity');
    await page.locator('#checkout-state').fill('NE');
    await page.locator('#checkout-zip').fill('10101');
    
    await page.getByRole('button', { name: /continue to payment/i }).click();
    await expect(page.getByText(/Instant digital fulfillment/i)).toBeVisible({ timeout: 20000 });
  });

  test('Search & Filter Industrial Performance', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    await searchInput.fill('Digital');
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1, { timeout: 20000 });
    await expect(page.getByText('Digital Genesis')).toBeVisible({ timeout: 20000 });
    
    await searchInput.fill('');
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3, { timeout: 20000 });
  });
});
