# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should complete a successful order journey
- Location: e2e/cart-checkout-comprehensive.spec.ts:203:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/checkout
Call log:
  - navigating to "http://localhost:3000/checkout", waiting until "load"

```

# Test source

```ts
  139 | 
  140 |     await page.locator('button:has-text("Edit Address")').click({ force: true });
  141 |     await expect(page.locator('#checkout-street')).toHaveValue('123 Test St');
  142 |   });
  143 | 
  144 |   test('should handle discount codes correctly', async ({ page }) => {
  145 |     await page.route('/api/auth/me', async (route) => {
  146 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 't@e.com', role: 'customer' }) });
  147 |     });
  148 |     
  149 |     await page.route('/api/cart', async (route) => {
  150 |       await route.fulfill({
  151 |         status: 200,
  152 |         contentType: 'application/json',
  153 |         body: JSON.stringify({
  154 |           id: 'cart-123',
  155 |           userId: 'u1',
  156 |           items: [{ productId: 'p1', name: 'Item', priceSnapshot: 10000, quantity: 1, imageUrl: '...' }],
  157 |           updatedAt: new Date().toISOString()
  158 |         })
  159 |       });
  160 |     });
  161 | 
  162 |     await page.route('/api/discounts/validate', async (route) => {
  163 |       const { code } = route.request().postDataJSON();
  164 |       if (code === 'VALID10') {
  165 |         await route.fulfill({
  166 |           status: 200,
  167 |           contentType: 'application/json',
  168 |           body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } })
  169 |         });
  170 |       } else {
  171 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, message: 'Invalid code' }) });
  172 |       }
  173 |     });
  174 | 
  175 |     await page.goto('/checkout');
  176 |     await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible({ timeout: 15000 });
  177 |     
  178 |     const discountInput = page.locator('input[placeholder="Discount code"]');
  179 |     await discountInput.fill('VALID10');
  180 |     await page.locator('button:has-text("Apply")').click({ force: true });
  181 |     await expect(page.locator('text=/VALID10 applied/i')).toBeVisible();
  182 |     await expect(page.locator('text=-$10.00').last()).toBeVisible();
  183 |   });
  184 | 
  185 |   test('should display free shipping milestone correctly', async ({ page }) => {
  186 |     await page.goto('/products');
  187 |     const firstProduct = page.locator('[data-testid="product-card"]').first();
  188 |     await expect(firstProduct).toBeVisible({ timeout: 15000 });
  189 |     
  190 |     await firstProduct.hover();
  191 |     await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
  192 |     
  193 |     await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  194 |     await expect(page.locator('text=/Shipping Progress/i')).toBeVisible();
  195 |     await expect(page.locator('text=$50.00 to go')).toBeVisible();
  196 |     
  197 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  198 |     await cartItem.locator('button:has(svg.lucide-plus)').click({ force: true });
  199 |     
  200 |     await expect(page.locator('text=/Free Shipping Unlocked/i')).toBeVisible();
  201 |   });
  202 | 
  203 |   test('should complete a successful order journey', async ({ page }) => {
  204 |     await page.route('/api/auth/me', async (route) => {
  205 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com', displayName: 'Test User', role: 'customer' }) });
  206 |     });
  207 | 
  208 |     await page.route('/api/cart', async (route) => {
  209 |       await route.fulfill({
  210 |         status: 200,
  211 |         contentType: 'application/json',
  212 |         body: JSON.stringify({
  213 |           id: 'cart-123',
  214 |           userId: 'u1',
  215 |           items: [{ productId: 'p1', name: 'Black Lotus', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }],
  216 |           updatedAt: new Date().toISOString()
  217 |         })
  218 |       });
  219 |     });
  220 | 
  221 |     await page.route('/api/orders', async (route) => {
  222 |       if (route.request().method() === 'POST') {
  223 |         await route.fulfill({
  224 |           status: 200,
  225 |           contentType: 'application/json',
  226 |           body: JSON.stringify({
  227 |             id: 'ord-999',
  228 |             userId: 'u1',
  229 |             status: 'confirmed',
  230 |             total: 5599,
  231 |             items: [{ productId: 'p1', name: 'Black Lotus', unitPrice: 5000, quantity: 1 }],
  232 |             shippingAddress: { street: '123 Test St', city: 'Test City', state: 'TS', zip: '12345', country: 'US' },
  233 |             createdAt: new Date().toISOString()
  234 |           })
  235 |         });
  236 |       }
  237 |     });
  238 | 
> 239 |     await page.goto('/checkout');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/checkout
  240 |     await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible();
  241 | 
  242 |     await page.locator('#checkout-street').fill('123 Test St');
  243 |     await page.locator('#checkout-city').fill('Test City');
  244 |     await page.locator('#checkout-state').fill('TS');
  245 |     await page.locator('#checkout-zip').fill('12345');
  246 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  247 | 
  248 |     await expect(page.locator('text=/Standard Shipping/i').first()).toBeVisible({ timeout: 15000 });
  249 |     await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
  250 | 
  251 |     await expect(page.locator('text=/Payment Method/i')).toBeVisible({ timeout: 10000 });
  252 |     const paymentBtn = page.locator('[data-testid="mock-checkout-button"]');
  253 |     await paymentBtn.click({ force: true });
  254 | 
  255 |     await expect(page.locator('text=/Thank you/i')).toBeVisible({ timeout: 25000 });
  256 |     await expect(page.locator('text=ORD-999')).toBeVisible();
  257 |   });
  258 | 
  259 |   test('should handle product variants in cart and checkout', async ({ page }) => {
  260 |     // Mock user for this test to ensure it fetches the mocked cart API
  261 |     await page.route('/api/auth/me', async (route) => {
  262 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'v@e.com', role: 'customer' }) });
  263 |     });
  264 | 
  265 |     await page.route('/api/cart', async (route) => {
  266 |       await route.fulfill({
  267 |         status: 200,
  268 |         contentType: 'application/json',
  269 |         body: JSON.stringify({
  270 |           id: 'cart-v1',
  271 |           userId: 'u1',
  272 |           items: [{ productId: 'p1', variantId: 'v2', variantTitle: 'Holographic', name: 'Black Lotus', priceSnapshot: 7500, quantity: 1, imageUrl: '...' }],
  273 |           updatedAt: new Date().toISOString()
  274 |         })
  275 |       });
  276 |     });
  277 | 
  278 |     await page.goto('/products');
  279 |     await openCart(page);
  280 |     
  281 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  282 |     await expect(cartItem).toContainText('Holographic', { timeout: 15000 });
  283 |     await expect(cartItem).toContainText('$75.00');
  284 | 
  285 |     await page.goto('/checkout');
  286 |     await expect(page.locator('text=/Holographic/i').last()).toBeVisible({ timeout: 10000 });
  287 |     await expect(page.locator('text=/$75.00/i').last()).toBeVisible();
  288 |   });
  289 | 
  290 |   test('should persist guest cart after page reload', async ({ page }) => {
  291 |     await page.goto('/products');
  292 |     const firstProduct = page.locator('[data-testid="product-card"]').first();
  293 |     await firstProduct.hover();
  294 |     await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
  295 |     
  296 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  297 | 
  298 |     await page.reload();
  299 |     await openCart(page);
  300 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1, { timeout: 15000 });
  301 |   });
  302 | 
  303 |   test('should enforce maximum quantity limits', async ({ page }) => {
  304 |     // Use authenticated user to ensure cart is fetched from API
  305 |     await page.route('/api/auth/me', async (route) => {
  306 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'q@e.com', role: 'customer' }) });
  307 |     });
  308 | 
  309 |     await page.route('/api/cart', async (route) => {
  310 |         await route.fulfill({
  311 |           status: 200,
  312 |           contentType: 'application/json',
  313 |           body: JSON.stringify({
  314 |             id: 'cart-qty',
  315 |             userId: 'u1',
  316 |             items: [{ productId: 'p1', name: 'Item', priceSnapshot: 1000, quantity: 9, imageUrl: '...' }],
  317 |             updatedAt: new Date().toISOString()
  318 |           })
  319 |         });
  320 |       });
  321 | 
  322 |     await page.goto('/products');
  323 |     await openCart(page);
  324 | 
  325 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  326 |     const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
  327 |     
  328 |     await plusBtn.click({ force: true });
  329 |     await expect(cartItem.locator('span').filter({ hasText: '10' }).first()).toBeVisible({ timeout: 10000 });
  330 |     await expect(plusBtn).toBeDisabled();
  331 |   });
  332 | 
  333 | });
  334 | 
```