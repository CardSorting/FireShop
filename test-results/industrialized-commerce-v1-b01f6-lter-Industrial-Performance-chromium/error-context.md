# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: industrialized-commerce-v10.spec.ts >> Industrialized Commerce Suite V10 >> Search & Filter Industrial Performance
- Location: e2e/industrialized-commerce-v10.spec.ts:187:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.fill: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="Search"]')

```

# Page snapshot

```yaml
- 'heading "Application error: a client-side exception has occurred (see the browser console for more information)." [level=2] [ref=e4]'
```

# Test source

```ts
  91  | 
  92  |       // 4. DISCOUNTS
  93  |       if (url.includes('/api/discounts/validate')) {
  94  |         if (body.code === 'BEE10') {
  95  |           return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1500, discount: { id: 'd1', code: 'BEE10', type: 'percentage', value: 10 } }) });
  96  |         }
  97  |         return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Invalid code' }) });
  98  |       }
  99  | 
  100 |       // 5. ORDERS
  101 |       if (url.includes('/api/orders') && method === 'POST') {
  102 |         return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ORD_123', status: 'confirmed' }) });
  103 |       }
  104 | 
  105 |       // 6. DEFAULT (Catch-all for stability)
  106 |       return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  107 |     });
  108 | 
  109 |     if (page.url() === 'about:blank') {
  110 |       await page.goto('/');
  111 |     }
  112 |     await page.evaluate(() => localStorage.clear());
  113 |   }
  114 | 
  115 |   test.beforeEach(async ({ page }) => {
  116 |     test.setTimeout(90000);
  117 |     await setupSubstrateMocks(page);
  118 |   });
  119 | 
  120 |   test('Full Life Cycle: Physical Product Purchase', async ({ page }) => {
  121 |     await page.goto('/products');
  122 |     const firstProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Physical Masterpiece' });
  123 |     await expect(firstProduct).toBeVisible({ timeout: 20000 });
  124 |     await firstProduct.hover();
  125 |     await firstProduct.getByTestId('quick-add').click();
  126 | 
  127 |     await expect(page.locator('h2', { hasText: /Cart/i })).toBeVisible({ timeout: 20000 });
  128 |     await page.getByRole('link', { name: /Checkout/i }).click();
  129 |     await page.getByTestId('cart-drawer').waitFor({ state: 'detached', timeout: 20000 });
  130 |     
  131 |     await page.waitForURL(/\/checkout/, { timeout: 20000 });
  132 |     await page.locator('#checkout-street').fill('777 Neon Blvd');
  133 |     await page.locator('#checkout-city').fill('Metropolis');
  134 |     await page.locator('#checkout-state').fill('CA');
  135 |     await page.locator('#checkout-zip').fill('90210');
  136 |     
  137 |     await page.getByRole('button', { name: /continue to shipping/i }).click();
  138 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 20000 });
  139 |     
  140 |     await page.getByRole('button', { name: /continue to payment/i }).click();
  141 |     await expect(page.getByText(/Secure Payment/i)).toBeVisible({ timeout: 20000 });
  142 |     
  143 |     await page.locator('input[placeholder*="Discount"]').fill('BEE10');
  144 |     await page.getByRole('button', { name: /Apply/i }).click();
  145 |     await expect(page.getByText(/BEE10 applied/i)).toBeVisible({ timeout: 20000 });
  146 | 
  147 |     await page.getByTestId('mock-checkout-button').click();
  148 |     await expect(page.getByText(/Thank you/i)).toBeVisible({ timeout: 40000 });
  149 |   });
  150 | 
  151 |   test('Edge Case: Multi-Currency & Precision Formatting', async ({ page }) => {
  152 |     state.items = [
  153 |       { productId: 'p1', productHandle: 'physical-masterpiece', name: 'Physical Masterpiece', priceSnapshot: 15000, quantity: 2, imageUrl: '...', isDigital: false }
  154 |     ];
  155 |     
  156 |     await page.goto('/cart');
  157 |     await expect(page.getByTestId('cart-total')).toHaveText(/\$300\.00/, { timeout: 20000 });
  158 | 
  159 |     const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: 'Physical Masterpiece' });
  160 |     await cartItem.getByTestId('increase-quantity').click();
  161 |     
  162 |     await expect(cartItem.getByTestId('item-quantity')).toHaveText('3', { timeout: 20000 });
  163 |     await expect(page.getByTestId('cart-total')).toHaveText(/\$450\.00/, { timeout: 20000 });
  164 |   });
  165 | 
  166 |   test('Constraint Validation: Sold Out Product', async ({ page }) => {
  167 |     await page.goto('/products');
  168 |     const soldOutProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Sold Out Artifact' });
  169 |     await expect(soldOutProduct.getByTestId('sold-out-badge')).toBeVisible({ timeout: 20000 });
  170 |   });
  171 | 
  172 |   test('Digital Workflow: Instant Fulfillment', async ({ page }) => {
  173 |     state.items = [
  174 |       { productId: 'p2', productHandle: 'digital-genesis', name: 'Digital Genesis', priceSnapshot: 2500, quantity: 1, imageUrl: '...', isDigital: true }
  175 |     ];
  176 |     
  177 |     await page.goto('/checkout');
  178 |     await page.locator('#checkout-street').fill('Digital Way 1');
  179 |     await page.locator('#checkout-city').fill('CyberCity');
  180 |     await page.locator('#checkout-state').fill('NE');
  181 |     await page.locator('#checkout-zip').fill('10101');
  182 |     
  183 |     await page.getByRole('button', { name: /continue to payment/i }).click();
  184 |     await expect(page.getByText(/Instant digital fulfillment/i)).toBeVisible({ timeout: 20000 });
  185 |   });
  186 | 
  187 |   test('Search & Filter Industrial Performance', async ({ page }) => {
  188 |     await page.goto('/products');
  189 |     const searchInput = page.locator('input[placeholder*="Search"]');
  190 |     
> 191 |     await searchInput.fill('Digital');
      |                       ^ Error: locator.fill: Test timeout of 90000ms exceeded.
  192 |     await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1, { timeout: 20000 });
  193 |     await expect(page.getByText('Digital Genesis')).toBeVisible({ timeout: 20000 });
  194 |     
  195 |     await searchInput.fill('');
  196 |     await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3, { timeout: 20000 });
  197 |   });
  198 | });
  199 | 
```