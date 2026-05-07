# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should validate checkout form and handle step transitions
- Location: e2e/cart-checkout-comprehensive.spec.ts:146:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/checkout
Call log:
  - navigating to "http://localhost:3000/checkout", waiting until "load"

```

# Test source

```ts
  62  |                         variants: [
  63  |                           { id: 'v1', productId: 'p1', title: 'Normal', price: 5000, stock: 10, option1: 'Normal' },
  64  |                           { id: 'v2', productId: 'p1', title: 'Holographic', price: 7500, stock: 5, option1: 'Holographic' }
  65  |                         ]
  66  |                     }
  67  |                 ],
  68  |                 nextCursor: null
  69  |             })
  70  |         });
  71  |     });
  72  |   });
  73  | 
  74  |   // --- REUSABLE HELPERS ---
  75  | 
  76  |   async function openCart(page: Page) {
  77  |     // Wait for any potential hydration to finish
  78  |     await page.waitForLoadState('networkidle');
  79  |     const cartBtn = page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first();
  80  |     await expect(cartBtn).toBeVisible({ timeout: 15000 });
  81  |     await cartBtn.click({ force: true });
  82  |     // Verify drawer is actually open by checking for header
  83  |     await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  84  |   }
  85  | 
  86  |   async function addItemToCart(page: Page) {
  87  |     await page.goto('/products');
  88  |     await page.waitForLoadState('networkidle');
  89  |     const firstProduct = page.locator('[data-testid="product-card"]').first();
  90  |     await expect(firstProduct).toBeVisible({ timeout: 15000 });
  91  |     await firstProduct.hover();
  92  |     await firstProduct.locator('button:has-text("Quick Add")').click({ force: true });
  93  |     await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  94  |   }
  95  | 
  96  |   // --- TEST SCENARIOS ---
  97  | 
  98  |   test('should handle complete cart lifecycle as guest', async ({ page }) => {
  99  |     // 1. Initial Empty State
  100 |     await page.goto('/cart');
  101 |     await expect(page.getByText(/Your cart is empty/i)).toBeVisible();
  102 | 
  103 |     // 2. Add and Verify
  104 |     await addItemToCart(page);
  105 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  106 |     await expect(cartItem).toBeVisible({ timeout: 10000 });
  107 |     await expect(cartItem).toContainText('Black Lotus');
  108 | 
  109 |     // 3. Quantity Operations
  110 |     const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
  111 |     const minusBtn = cartItem.locator('button:has(svg.lucide-minus)');
  112 |     
  113 |     await plusBtn.click({ force: true });
  114 |     await expect(cartItem.getByText('2')).toBeVisible({ timeout: 10000 });
  115 |     
  116 |     await minusBtn.click({ force: true });
  117 |     await expect(cartItem.getByText('1')).toBeVisible({ timeout: 10000 });
  118 | 
  119 |     // 4. Persistence Check
  120 |     await page.reload();
  121 |     await openCart(page);
  122 |     // Wait for the item to be visible after hydration
  123 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  124 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  125 | 
  126 |     // 5. Cleanup
  127 |     await page.locator('[data-testid="cart-item"]').first().locator('button[title="Remove item"]').click({ force: true });
  128 |     await expect(page.getByText(/Your cart is empty/i)).toBeVisible({ timeout: 10000 });
  129 |   });
  130 | 
  131 |   test('should calculate free shipping threshold milestones correctly', async ({ page }) => {
  132 |     await addItemToCart(page);
  133 |     
  134 |     // Check initial state ($50 item, $100 threshold)
  135 |     await expect(page.getByText(/Shipping Progress/i)).toBeVisible();
  136 |     // Using explicit string for visibility
  137 |     await expect(page.getByText('$50.00 to go')).toBeVisible();
  138 |     
  139 |     // Increase quantity to reach threshold
  140 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  141 |     await cartItem.locator('button:has(svg.lucide-plus)').click({ force: true });
  142 |     
  143 |     await expect(page.getByText(/Free Shipping Unlocked/i)).toBeVisible({ timeout: 10000 });
  144 |   });
  145 | 
  146 |   test('should validate checkout form and handle step transitions', async ({ page }) => {
  147 |     // Authenticated user
  148 |     await page.route('/api/auth/me', async (route) => {
  149 |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'tester@example.com' }) });
  150 |     });
  151 | 
  152 |     await page.route('/api/cart', async (route) => {
  153 |       await route.fulfill({
  154 |         status: 200,
  155 |         contentType: 'application/json',
  156 |         body: JSON.stringify({
  157 |           id: 'c1', userId: 'u1', items: [{ productId: 'p1', name: 'Art Print', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]
  158 |         })
  159 |       });
  160 |     });
  161 | 
> 162 |     await page.goto('/checkout');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/checkout
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
  256 |     await page.goto('/checkout');
  257 |     await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible();
  258 |     
  259 |     // Fill all required fields including email
  260 |     await page.locator('#checkout-email').fill('tester@example.com');
  261 |     await page.locator('#checkout-street').fill('123 Hive St');
  262 |     await page.locator('#checkout-city').fill('NY');
```