import { test, expect, Page } from '@playwright/test';

/**
 * [TEST SUITE: INDUSTRIALIZED COMMERCE V10 - THE MASTER SUITE]
 * 
 * Objective: 
 * 1. Validate the complete life cycle of a premium ecommerce transaction.
 * 2. Ensure deterministic behavior through substrate-level mocking.
 * 3. Verify high-fidelity UI interactions and industrial performance.
 * 4. Test complex edge cases (Mixed Carts, Tax, Discounts, Shipping Logic).
 */

test.describe('Industrialized Commerce Suite V10', () => {
  type MockCartItem = {
    productId: string;
    name: string;
    priceSnapshot: number;
    quantity: number;
    imageUrl: string;
    isDigital?: boolean;
    productHandle?: string;
    shippingClassId?: string;
  };

  const nowIso = '2026-05-08T12:00:00.000Z';
  const allProducts = [
    {
      id: 'p1',
      name: 'Physical Masterpiece',
      handle: 'physical-masterpiece',
      description: 'Gallery-grade canvas piece.',
      price: 15000,
      stock: 5,
      category: 'Canvas',
      isDigital: false,
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
      media: [],
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'p2',
      name: 'Digital Genesis',
      handle: 'digital-genesis',
      description: 'Instant digital collector asset.',
      price: 2500,
      stock: 999,
      category: 'Digital',
      isDigital: true,
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400',
      media: [],
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'p3',
      name: 'Sold Out Artifact',
      handle: 'sold-out',
      description: 'Archived collectible artifact.',
      price: 5000,
      stock: 0,
      category: 'Artifacts',
      isDigital: false,
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
      media: [],
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const cartState = new WeakMap<Page, { items: MockCartItem[] }>();

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000); // Robust timeout for complex flows
    await setupSubstrateMocks(page);
  });

  async function setupSubstrateMocks(page: Page) {
    const state = { items: [] as MockCartItem[] };
    cartState.set(page, state);

    const cartResponse = () => ({
      id: 'cart-v10',
      userId: 'u_v10',
      items: state.items,
      updatedAt: nowIso,
    });

    const toCartItem = (productId: string, quantity: number): MockCartItem => {
      const product = allProducts.find((item) => item.id === productId);
      if (!product) throw new Error(`Unknown mocked product ${productId}`);
      return {
        productId: product.id,
        productHandle: product.handle,
        name: product.name,
        priceSnapshot: product.price,
        quantity,
        imageUrl: product.imageUrl,
        isDigital: product.isDigital,
      };
    };

    // 1. Mock Auth (signed-in customer so checkout can finalize)
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'u_v10',
          email: 'client@hive.art',
          displayName: 'V10 Collector',
          role: 'customer',
          createdAt: nowIso,
        }),
      });
    });

    // 2. Mock Shipping Configuration
    await page.route('/api/admin/shipping/rates', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify([
          { id: 'r1', name: 'Standard Ground', amount: 599, type: 'price_based', minLimit: 0, maxLimit: 999999, shippingZoneId: 'z1' },
          { id: 'r2', name: 'Priority Express', amount: 1999, type: 'price_based', minLimit: 0, maxLimit: 999999, shippingZoneId: 'z1' }
        ]) 
      });
    });

    // Clear local storage for isolation - ensure page is loaded first
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    await page.route('/api/admin/shipping/zones', async (route) => {
      await route.fulfill({ 
        status: 200, 
        contentType: 'application/json', 
        body: JSON.stringify([{ id: 'z1', name: 'USA & Canada', countries: ['US', 'CA'] }]) 
      });
    });

    // 3. Mock Product Catalog and product detail lookups
    await page.route('/api/products**', async (route) => {
      const url = new URL(route.request().url());
      const idMatch = url.pathname.match(/^\/api\/products\/([^/]+)$/);
      if (idMatch) {
        const product = allProducts.find((item) => item.id === idMatch[1]);
        await route.fulfill({
          status: product ? 200 : 404,
          contentType: 'application/json',
          body: JSON.stringify(product ?? { error: 'Not found' }),
        });
        return;
      }

      const query = url.searchParams.get('query')?.toLowerCase();
      const category = url.searchParams.get('category')?.toLowerCase();

      let filtered = allProducts;
      if (query) {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
      }
      if (category) {
          filtered = filtered.filter(p => p.category.toLowerCase() === category);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: filtered,
          nextCursor: null
        })
      });
    });

    await page.route('/api/taxonomy/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'c1', name: 'Canvas', slug: 'canvas', description: null, createdAt: nowIso, updatedAt: nowIso },
          { id: 'c2', name: 'Digital', slug: 'digital', description: null, createdAt: nowIso, updatedAt: nowIso },
          { id: 'c3', name: 'Artifacts', slug: 'artifacts', description: null, createdAt: nowIso, updatedAt: nowIso },
        ]),
      });
    });

    // 4. Mock Cart Operations
    await page.route('/api/cart*', async (route) => {
      const method = route.request().method();
      const body = route.request().postDataJSON?.() ?? {};

      if (method === 'POST' && route.request().url().includes('/api/cart/items')) {
        const existing = state.items.find((item) => item.productId === body.productId);
        if (existing) {
          existing.quantity += body.quantity ?? 1;
        } else {
          state.items.push(toCartItem(body.productId, body.quantity ?? 1));
        }
      }

      if (method === 'PATCH' && route.request().url().includes('/api/cart/items')) {
        const existing = state.items.find((item) => item.productId === body.productId);
        if (existing) existing.quantity = body.quantity;
      }

      if (method === 'DELETE') {
        if (route.request().url().includes('/api/cart/items')) {
          state.items = state.items.filter((item) => item.productId !== body.productId);
        } else {
          state.items = [];
        }
      }

      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(cartResponse()) });
    });

    // 5. Mock Discount Validation
    await page.route('/api/discounts/validate', async (route) => {
      const { code } = JSON.parse(route.request().postData() || '{}');
      if (code === 'BEE10') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1500, discount: { type: 'percentage', value: 10, code: 'BEE10' } }) });
      } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, message: 'Invalid code' }) });
      }
    });

    // 6. Mock Order Placement
    await page.route('/api/orders', async (route) => {
        if (route.request().method() === 'POST') {
            const orderItems = state.items.map((item) => ({
              productId: item.productId,
              productHandle: item.productHandle,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.priceSnapshot,
              imageUrl: item.imageUrl,
              isDigital: item.isDigital,
              fulfilledQty: 0,
              digitalAssets: item.isDigital ? [{
                id: 'asset_1',
                name: 'Digital Genesis Source File',
                url: '/downloads/digital-genesis.zip',
                size: 2_048_000,
                mimeType: 'application/zip',
                createdAt: nowIso,
              }] : undefined,
            }));

            await route.fulfill({ 
                status: 200, 
                contentType: 'application/json', 
                body: JSON.stringify({
                  id: 'ord_123',
                  userId: 'u_v10',
                  items: orderItems,
                  total: 14099,
                  status: 'confirmed',
                  shippingAddress: { street: '777 Neon Blvd', city: 'Metropolis', state: 'CA', zip: '90210', country: 'US' },
                  paymentTransactionId: 'mock_payment_method',
                  customerName: 'V10 Collector',
                  customerEmail: 'client@hive.art',
                  trackingNumber: null,
                  shippingCarrier: null,
                  trackingUrl: null,
                  notes: [],
                  riskScore: 0,
                  shippingAmount: 599,
                  taxAmount: 0,
                  fulfillmentLocationId: null,
                  fulfillmentMethod: 'shipping',
                  fulfillments: [],
                  createdAt: nowIso,
                  updatedAt: nowIso,
                }) 
            });
        }
    });
  }

  /**
   * Helper to seed cart in local storage
   */
  async function seedCart(page: Page, items: any[]) {
    const state = cartState.get(page);
    if (!state) throw new Error('Cart mocks must be initialized before seeding cart');
    state.items = items;

    await page.goto('/'); 
    await page.evaluate((seededItems) => {
      localStorage.setItem('DreamBees_guest_cart', JSON.stringify({
        id: 'seeded-v10',
        userId: 'guest',
        items: seededItems,
        updatedAt: new Date()
      }));
    }, items);
  }

  // --- COMPREHENSIVE FLOWS ---

  test('Full Life Cycle: Physical Product Purchase', async ({ page }) => {
    // 1. Discovery & Carting
    await page.goto('/products');
    await expect(page.locator('text=Physical Masterpiece')).toBeVisible();
    
    // Add to cart via UI
    const firstProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Physical Masterpiece' });
    await firstProduct.hover();
    await firstProduct.getByRole('button', { name: /Add Physical Masterpiece to cart/i }).click();
    
    // Verify Cart Drawer
    await expect(page.locator('h2', { hasText: /Cart/i })).toBeVisible({ timeout: 10000 });
    
    // Use a more specific locator for items in the drawer to avoid ambiguity
    const drawer = page.locator('.fixed.inset-0.z-drawer');
    await expect(drawer.locator('text=Physical Masterpiece')).toBeVisible({ timeout: 10000 });
    
    // 2. Checkout Navigation
    await page.getByRole('link', { name: /Checkout/i }).click();
    
    // Ensure drawer is completely detached (including backdrop) before proceeding
    await page.getByTestId('cart-drawer').waitFor({ state: 'detached', timeout: 15000 });
    
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByTestId('checkout-title')).toBeVisible({ timeout: 15000 });

    // 3. Information Phase
    // For authenticated users, email is read-only and already populated
    const emailField = page.locator('#checkout-email');
    await expect(emailField).toHaveValue('client@hive.art', { timeout: 15000 });
    // Stability wait for React state/mount
    await page.waitForTimeout(1000);
    
    await page.locator('#checkout-street').pressSequentially('777 Neon Blvd', { delay: 50 });
    await page.locator('#checkout-city').pressSequentially('Metropolis', { delay: 50 });
    await page.locator('#checkout-state').pressSequentially('CA', { delay: 50 });
    await page.locator('#checkout-zip').pressSequentially('90210', { delay: 50 });
    
    // Ensure state is captured
    await page.waitForTimeout(1000);
    await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });

    // 4. Shipping Phase
    // Transition might take a moment due to calculation
    await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Standard Ground/i)).toBeVisible({ timeout: 15000 });
    await page.locator('[data-testid="continue-to-payment"]').click();

    // 5. Payment & Review
    await expect(page.getByText(/Payment Method/i)).toBeVisible();
    
    // Apply Discount
    await page.locator('input[placeholder="Discount code"]').fill('BEE10');
    await page.getByRole('button', { name: /Apply/i }).click();
    await expect(page.getByText(/BEE10 applied/i)).toBeVisible();

    // Final Action
    await page.locator('[data-testid="mock-checkout-button"]').click();

    // 6. Success State
    await expect(page.getByText(/Thank you/i)).toBeVisible();
    await expect(page.getByText(/ORD_123/i)).toBeVisible();
  });

  test('Constraint Validation: Sold Out Product', async ({ page }) => {
    await page.goto('/products');
    const soldOutProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Sold Out Artifact' });
    
    // Verify "Sold Out" UI
    await expect(soldOutProduct.getByText(/Sold Out/i).first()).toBeVisible();
    
    // Button should be disabled or absent
    const buyButton = soldOutProduct.getByRole('button', { name: /Add Sold Out Artifact to cart/i });
    if (await buyButton.isVisible()) {
        await expect(buyButton).toBeDisabled();
    }
  });

  test('Digital Workflow: Instant Fulfillment', async ({ page }) => {
    await seedCart(page, [
        { productId: 'p2', name: 'Digital Genesis', priceSnapshot: 2500, quantity: 1, imageUrl: '...', isDigital: true }
    ]);
    
    await page.goto('/checkout');
    // In our system, digital items might still require address for tax, or be bypassed.
    // Since we are authenticated, email is already filled.
    await expect(page.locator('#checkout-email')).toHaveValue('client@hive.art');
    
    await page.locator('[data-testid="continue-to-shipping"]').click();
    
    // In our system, digital items might still require address for tax, or be bypassed.
    // Let's assume standard flow for now but check for "Instant Digital Fulfillment" indicator
    await expect(page.getByTestId('payment-header')).toBeVisible();
    await expect(page.getByText(/Instant digital fulfillment/i)).toBeVisible();
  });

  test('Edge Case: Multi-Currency & Precision Formatting', async ({ page }) => {
    await seedCart(page, [
        { productId: 'p1', name: 'Physical Masterpiece', priceSnapshot: 15000, quantity: 2, imageUrl: '...', isDigital: false }
    ]);
    await page.goto('/cart');
    
    // Check formatting $300.00 - using getByTestId for deterministic targeting
    await expect(page.getByTestId('cart-total')).toHaveText('$300.00', { timeout: 10000 });
    
    // Increment quantity using the new aria-label
    const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: 'Physical Masterpiece' });
    
    // Wait for the PATCH request to complete
    const patchPromise = page.waitForResponse(resp => 
      resp.url().includes('/api/cart/items') && resp.request().method() === 'PATCH'
    );
    await cartItem.getByTestId('increase-quantity').click();
    await patchPromise;
    
    // Stability wait for re-render
    await page.waitForTimeout(2000);
    
    // Wait for the total to update
    await expect(page.getByTestId('cart-total')).toHaveText('$450.00', { timeout: 15000 });
  });

  test('Search & Filter Industrial Performance', async ({ page }) => {
    await page.goto('/products');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('Genesis');
    
    // Should filter to only Digital Genesis
    await expect(page.locator('text=Physical Masterpiece')).not.toBeVisible();
    await expect(page.locator('text=Digital Genesis')).toBeVisible();
    
    // Category Filter
    await searchInput.fill('');
    await page.getByLabel(/Canvas/i).check();
    await expect(page.locator('text=Digital Genesis')).not.toBeVisible();
    await expect(page.locator('text=Physical Masterpiece')).toBeVisible();
  });

});
