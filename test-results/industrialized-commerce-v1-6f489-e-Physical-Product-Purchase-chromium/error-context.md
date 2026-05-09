# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: industrialized-commerce-v10.spec.ts >> Industrialized Commerce Suite V10 >> Full Life Cycle: Physical Product Purchase
- Location: e2e/industrialized-commerce-v10.spec.ts:120:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="product-card"]').filter({ hasText: 'Physical Masterpiece' })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('[data-testid="product-card"]').filter({ hasText: 'Physical Masterpiece' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic:
    - generic [ref=e4] [cursor=pointer]:
      - img [ref=e5]
      - generic [ref=e7]: 2 errors
      - button "Hide Errors" [ref=e8]:
        - img [ref=e9]
    - status [ref=e12]:
      - generic [ref=e13]:
        - img [ref=e15]
        - generic [ref=e17]:
          - text: Static route
          - button "Hide static indicator" [ref=e18] [cursor=pointer]:
            - img [ref=e19]
  - alert [ref=e22]
  - generic [ref=e24]:
    - img [ref=e26]
    - heading "Something went wrong" [level=1] [ref=e28]
    - paragraph [ref=e29]: We're sorry, but an unexpected error occurred. The application may need to be refreshed.
    - generic [ref=e30]:
      - paragraph [ref=e31]: "Error details:"
      - paragraph [ref=e32]: Cannot read properties of undefined (reading 'title')
    - button "Reload Page" [ref=e33]
```

# Test source

```ts
  23  |       {
  24  |         id: 'p2', handle: 'digital-genesis', name: 'Digital Genesis',
  25  |         price: 2500, imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400',
  26  |         isDigital: true, stock: 9999,
  27  |       },
  28  |       {
  29  |         id: 'p3', handle: 'sold-out-artifact', name: 'Sold Out Artifact',
  30  |         price: 9900, imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=400',
  31  |         isDigital: false, stock: 0,
  32  |       }
  33  |     ];
  34  | 
  35  |     const toCartItem = (productId: string, quantity: number): any => {
  36  |       const product = allProducts.find((item) => item.id === productId);
  37  |       if (!product) return null;
  38  |       return {
  39  |         productId: product.id, productHandle: product.handle, name: product.name,
  40  |         priceSnapshot: product.price, quantity, imageUrl: product.imageUrl, isDigital: product.isDigital,
  41  |       };
  42  |     };
  43  | 
  44  |     await page.route('**/api/**', async (route) => {
  45  |       const url = route.request().url();
  46  |       const method = route.request().method();
  47  |       const body = route.request().postDataJSON() || {};
  48  |       const searchParams = new URL(url).searchParams;
  49  | 
  50  |       // 1. AUTH
  51  |       if (url.includes('/api/auth/me')) {
  52  |         return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
  53  |           id: 'u_v10', email: 'client@hive.art', displayName: 'Industrial Tester', role: 'customer', createdAt: nowIso
  54  |         }) });
  55  |       }
  56  | 
  57  |       // 2. PRODUCTS
  58  |       if (url.includes('/api/products')) {
  59  |         if (url.includes('/api/products/')) {
  60  |           const idOrHandle = url.split('/').pop()?.split('?')[0];
  61  |           const product = allProducts.find(p => p.id === idOrHandle || p.handle === idOrHandle);
  62  |           return product ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(product) }) : route.fulfill({ status: 404 });
  63  |         }
  64  |         const query = searchParams.get('query')?.toLowerCase();
  65  |         let products = allProducts;
  66  |         if (query) {
  67  |           products = allProducts.filter(p => p.name.toLowerCase().includes(query) || p.handle.toLowerCase().includes(query));
  68  |         }
  69  |         return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products }) });
  70  |       }
  71  | 
  72  |       // 3. CART
  73  |       if (url.includes('/api/cart')) {
  74  |         if (method === 'POST' && url.includes('/items')) {
  75  |           const existing = state.items.find(i => i.productId === body.productId && (i.variantId || undefined) === (body.variantId || undefined));
  76  |           if (existing) existing.quantity += (body.quantity ?? 1);
  77  |           else {
  78  |             const newItem = toCartItem(body.productId, body.quantity ?? 1);
  79  |             if (newItem) state.items.push(newItem);
  80  |           }
  81  |         } else if (method === 'PATCH' && url.includes('/items')) {
  82  |           const existing = state.items.find(i => i.productId === body.productId && (i.variantId || undefined) === (body.variantId || undefined));
  83  |           if (existing) existing.quantity = body.quantity;
  84  |         } else if (method === 'DELETE' && url.includes('/items')) {
  85  |           state.items = state.items.filter(i => !(i.productId === body.productId && (i.variantId || undefined) === (body.variantId || undefined)));
  86  |         } else if (method === 'DELETE') {
  87  |           state.items = [];
  88  |         }
  89  |         return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'c1', userId: 'u_v10', items: [...state.items], updatedAt: nowIso }) });
  90  |       }
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
> 123 |     await expect(firstProduct).toBeVisible({ timeout: 20000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
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
  191 |     await searchInput.fill('Digital');
  192 |     await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1, { timeout: 20000 });
  193 |     await expect(page.getByText('Digital Genesis')).toBeVisible({ timeout: 20000 });
  194 |     
  195 |     await searchInput.fill('');
  196 |     await expect(page.locator('[data-testid="product-card"]')).toHaveCount(3, { timeout: 20000 });
  197 |   });
  198 | });
  199 | 
```