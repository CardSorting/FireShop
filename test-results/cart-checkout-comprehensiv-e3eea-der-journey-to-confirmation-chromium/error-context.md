# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should execute a successful order journey to confirmation
- Location: e2e/cart-checkout-comprehensive.spec.ts:224:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/checkout
Call log:
  - navigating to "http://localhost:3000/checkout", waiting until "load"

```

# Test source

```ts
  156 |         body: JSON.stringify({
  157 |           id: 'c1', userId: 'u1', items: [{ productId: 'p1', name: 'Art Print', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]
  158 |         })
  159 |       });
  160 |     });
  161 | 
  162 |     await page.goto('/checkout');
  163 |     await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible({ timeout: 15000 });
  164 | 
  165 |     // Step 1: Validation
  166 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  167 |     await expect(page.getByText(/Enter the street address/i)).toBeVisible();
  168 | 
  169 |     // Step 2: Fulfillment info
  170 |     await page.locator('#checkout-street').fill('123 Hive St');
  171 |     await page.locator('#checkout-city').fill('New York');
  172 |     await page.locator('#checkout-state').fill('NY');
  173 |     await page.locator('#checkout-zip').fill('10001');
  174 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  175 | 
  176 |     // Step 3: Shipping method
  177 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 10000 });
  178 |     await expect(page.getByText(/Standard Shipping/i).first()).toBeVisible();
  179 |     await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
  180 | 
  181 |     // Step 4: Payment Summary
  182 |     await expect(page.getByText(/Secure Payment/i)).toBeVisible({ timeout: 10000 });
  183 |     await expect(page.getByText(/123 Hive St/i)).toBeVisible();
  184 |   });
  185 | 
  186 |   test('should handle discount codes and reflect them in total', async ({ page }) => {
  187 |     await page.route('/api/auth/me', async (route) => {
  188 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com' }) });
  189 |     });
  190 |     
  191 |     await page.route('/api/cart', async (route) => {
  192 |       await route.fulfill({
  193 |         status: 200,
  194 |         contentType: 'application/json',
  195 |         body: JSON.stringify({
  196 |           id: 'c1', items: [{ productId: 'p1', name: 'Item', priceSnapshot: 10000, quantity: 1, imageUrl: '...' }]
  197 |         })
  198 |       });
  199 |     });
  200 | 
  201 |     await page.route('/api/discounts/validate', async (route) => {
  202 |       const { code } = route.request().postDataJSON();
  203 |       if (code === 'SAVE20') {
  204 |         await route.fulfill({
  205 |           status: 200,
  206 |           contentType: 'application/json',
  207 |           body: JSON.stringify({ valid: true, discountAmount: 2000, discount: { type: 'fixed_amount', value: 2000 } })
  208 |         });
  209 |       } else {
  210 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, message: 'Invalid code' }) });
  211 |       }
  212 |     });
  213 | 
  214 |     await page.goto('/checkout');
  215 |     const discountInput = page.locator('input[placeholder="Discount code"]');
  216 |     await discountInput.fill('SAVE20');
  217 |     await page.getByRole('button', { name: /Apply/i }).click({ force: true });
  218 | 
  219 |     await expect(page.getByText(/SAVE20 applied/i)).toBeVisible({ timeout: 10000 });
  220 |     // Use exact string to avoid regex escaping issues
  221 |     await expect(page.getByText('-$20.00')).toBeVisible({ timeout: 10000 });
  222 |   });
  223 | 
  224 |   test('should execute a successful order journey to confirmation', async ({ page }) => {
  225 |     await page.route('/api/auth/me', async (route) => {
  226 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com', displayName: 'Collector' }) });
  227 |     });
  228 | 
  229 |     await page.route('/api/cart', async (route) => {
  230 |       await route.fulfill({
  231 |         status: 200,
  232 |         contentType: 'application/json',
  233 |         body: JSON.stringify({
  234 |           id: 'c1', items: [{ productId: 'p1', name: 'Masterpiece', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]
  235 |         })
  236 |       });
  237 |     });
  238 | 
  239 |     await page.route('/api/orders', async (route) => {
  240 |       if (route.request().method() === 'POST') {
  241 |         await route.fulfill({
  242 |           status: 200,
  243 |           contentType: 'application/json',
  244 |           body: JSON.stringify({
  245 |             id: 'ord-confirm-777',
  246 |             status: 'confirmed',
  247 |             total: 5599,
  248 |             items: [{ productId: 'p1', name: 'Masterpiece', unitPrice: 5000, quantity: 1 }],
  249 |             shippingAddress: { street: '123 Hive St', city: 'NY', state: 'NY', zip: '10001', country: 'US' },
  250 |             createdAt: new Date().toISOString()
  251 |           })
  252 |         });
  253 |       }
  254 |     });
  255 | 
> 256 |     await page.goto('/checkout');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/checkout
  257 |     await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible();
  258 |     
  259 |     // Fill all required fields including email
  260 |     await page.locator('#checkout-email').fill('tester@example.com');
  261 |     await page.locator('#checkout-street').fill('123 Hive St');
  262 |     await page.locator('#checkout-city').fill('NY');
  263 |     await page.locator('#checkout-state').fill('NY');
  264 |     await page.locator('#checkout-zip').fill('10001');
  265 |     
  266 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  267 |     
  268 |     // Wait for transition to shipping
  269 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
  270 |     await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
  271 | 
  272 |     // Finalize
  273 |     const finalizeBtn = page.locator('[data-testid="mock-checkout-button"]');
  274 |     await expect(finalizeBtn).toBeVisible({ timeout: 20000 });
  275 |     await finalizeBtn.click({ force: true });
  276 | 
  277 |     // Success check
  278 |     await expect(page.getByText(/Thank you for your order/i)).toBeVisible({ timeout: 30000 });
  279 |     await expect(page.getByText(/ORD-CONFIRM-777/i)).toBeVisible();
  280 |   });
  281 | 
  282 |   test('should handle variant selection and correct pricing in cart', async ({ page }) => {
  283 |     // Authenticated for predictable cart fetching
  284 |     await page.route('/api/auth/me', async (route) => {
  285 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'v@e.com' }) });
  286 |     });
  287 | 
  288 |     await page.route('/api/cart', async (route) => {
  289 |       await route.fulfill({
  290 |         status: 200,
  291 |         contentType: 'application/json',
  292 |         body: JSON.stringify({
  293 |           id: 'cart-v1',
  294 |           userId: 'u1',
  295 |           items: [{ 
  296 |             productId: 'p1', 
  297 |             variantId: 'v2', 
  298 |             variantTitle: 'Holographic', 
  299 |             name: 'Black Lotus', 
  300 |             priceSnapshot: 7500, 
  301 |             quantity: 1, 
  302 |             imageUrl: '...' 
  303 |           }]
  304 |         })
  305 |       });
  306 |     });
  307 | 
  308 |     await page.goto('/products');
  309 |     await openCart(page);
  310 |     
  311 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  312 |     await expect(cartItem).toContainText('Holographic', { timeout: 15000 });
  313 |     await expect(cartItem).toContainText('$75.00');
  314 | 
  315 |     // Verify in checkout summary
  316 |     await page.goto('/checkout');
  317 |     await expect(page.locator('aside').getByText(/Holographic/i).first()).toBeVisible({ timeout: 15000 });
  318 |     await expect(page.locator('aside').getByText('75.00').last()).toBeVisible();
  319 |   });
  320 | 
  321 |   test('should skip shipping step for purely digital orders', async ({ page }) => {
  322 |     await page.route('/api/auth/me', async (route) => {
  323 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'd@e.com' }) });
  324 |     });
  325 | 
  326 |     await page.route('/api/cart', async (route) => {
  327 |       await route.fulfill({
  328 |         status: 200,
  329 |         contentType: 'application/json',
  330 |         body: JSON.stringify({
  331 |           id: 'cart-digital',
  332 |           items: [{ productId: 'p1', name: 'Digital Art', priceSnapshot: 2500, quantity: 1, isDigital: true, imageUrl: '...' }]
  333 |         })
  334 |       });
  335 |     });
  336 | 
  337 |     await page.goto('/checkout');
  338 |     
  339 |     // Fill identity (email)
  340 |     await page.locator('#checkout-email').fill('d@e.com');
  341 |     
  342 |     // Click continue - should go straight to payment because it's digital
  343 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  344 |     
  345 |     await expect(page.getByText(/Secure Payment/i)).toBeVisible({ timeout: 15000 });
  346 |     await expect(page.getByText(/Instant digital fulfillment/i)).toBeVisible();
  347 |     
  348 |     // Verify shipping step is not in the stepper
  349 |     await expect(page.locator('text=/Delivery Speed/i')).not.toBeVisible();
  350 |   });
  351 | 
  352 |   test('should enforce max quantity limits reliably', async ({ page }) => {
  353 |     await page.route('/api/auth/me', async (route) => {
  354 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'limit@e.com' }) });
  355 |     });
  356 | 
```