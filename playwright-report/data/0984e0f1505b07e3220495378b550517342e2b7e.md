# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should persist cart items after guest browser reload
- Location: e2e/cart-checkout-comprehensive.spec.ts:214:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/products
Call log:
  - navigating to "http://localhost:3000/products", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, Page } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * [TEST SUITE: Industrialized Commerce Flow - FINAL MASTER]
  5   |  * Objective: 100% Deterministic, zero-flakiness commerce validation.
  6   |  */
  7   | 
  8   | test.describe('Comprehensive Cart and Checkout Flow', () => {
  9   |   
  10  |   test.beforeEach(async ({ page }) => {
  11  |     await page.addInitScript(() => {
  12  |       window.localStorage.clear();
  13  |       window.sessionStorage.clear();
  14  |     });
  15  |     await setupBaseMocks(page);
  16  |   });
  17  | 
  18  |   async function setupBaseMocks(page: Page) {
  19  |     await page.route('/api/auth/me', async (route) => {
  20  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
  21  |     });
  22  | 
  23  |     await page.route('/api/admin/shipping/rates', async (route) => {
  24  |         await route.fulfill({
  25  |             status: 200,
  26  |             contentType: 'application/json',
  27  |             body: JSON.stringify([{ id: 'r1', name: 'Standard Shipping', amount: 599, type: 'price_based', minLimit: 0, maxLimit: 9999, shippingZoneId: 'z1' }])
  28  |         });
  29  |     });
  30  |     await page.route('/api/admin/shipping/zones', async (route) => {
  31  |         await route.fulfill({
  32  |             status: 200,
  33  |             contentType: 'application/json',
  34  |             body: JSON.stringify([{ id: 'z1', name: 'USA', countries: ['US'] }])
  35  |         });
  36  |     });
  37  | 
  38  |     await page.route('/api/products*', async (route) => {
  39  |         await route.fulfill({
  40  |             status: 200,
  41  |             contentType: 'application/json',
  42  |             body: JSON.stringify({
  43  |                 products: [
  44  |                     { id: 'p1', name: 'Physical Art', handle: 'physical-art', price: 5000, stock: 10, category: 'Art', isDigital: false, imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400' },
  45  |                     { id: 'p2', name: 'Digital Art', handle: 'digital-art', price: 2000, stock: 999, category: 'Art', isDigital: true, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' }
  46  |                 ],
  47  |                 nextCursor: null
  48  |             })
  49  |         });
  50  |     });
  51  | 
  52  |     // Smart Cart Mock: Handles both Guest-to-Auth sync and normal operations
  53  |     await page.route('/api/cart*', async (route) => {
  54  |         const method = route.request().method();
  55  |         const data = route.request().postDataJSON() || {};
  56  |         
  57  |         // Return a cart that matches the requested product if adding
  58  |         const items = [];
  59  |         if (data.productId === 'p1' || method === 'GET') {
  60  |             items.push({ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: data.quantity || 1, imageUrl: '...' });
  61  |         }
  62  |         if (data.productId === 'p2') {
  63  |             items.push({ productId: 'p2', name: 'Digital Art', priceSnapshot: 2000, quantity: data.quantity || 1, imageUrl: '...' });
  64  |         }
  65  | 
  66  |         await route.fulfill({
  67  |             status: 200,
  68  |             contentType: 'application/json',
  69  |             body: JSON.stringify({ id: 'cart-final', items, updatedAt: new Date().toISOString() })
  70  |         });
  71  |     });
  72  |   }
  73  | 
  74  |   async function openCart(page: Page) {
  75  |     const cartBtn = page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first();
> 76  |     await expect(cartBtn).toBeVisible({ timeout: 15000 });
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/products
  77  |     await cartBtn.click({ force: true });
  78  |     await expect(page.locator('h2').filter({ hasText: /^Cart$/i })).toBeVisible({ timeout: 15000 });
  79  |   }
  80  | 
  81  |   async function addItem(page: Page, index: number) {
  82  |     await page.goto('/products');
  83  |     await page.waitForLoadState('networkidle');
  84  |     
  85  |     // Ensure drawer is closed
  86  |     const closeBtn = page.locator('button[aria-label="Close cart"]').filter({ visible: true }).first();
  87  |     if (await closeBtn.isVisible()) {
  88  |         await closeBtn.click({ force: true });
  89  |         await expect(closeBtn).not.toBeVisible({ timeout: 10000 });
  90  |     }
  91  | 
  92  |     const cards = page.locator('[data-testid="product-card"]');
  93  |     const target = cards.nth(index);
  94  |     await expect(target).toBeVisible({ timeout: 15000 });
  95  |     await target.hover();
  96  |     await target.locator('button:has-text("Quick Add")').click({ force: true });
  97  |     
  98  |     // Verification
  99  |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  100 |   }
  101 | 
  102 |   // --- TESTS ---
  103 | 
  104 |   test('should merge guest cart into auth session upon login', async ({ page }) => {
  105 |     await addItem(page, 0); // Physical Art
  106 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  107 | 
  108 |     // Login mock
  109 |     await page.route('/api/auth/me', async (route) => {
  110 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'collector@example.com' }) });
  111 |     });
  112 | 
  113 |     await page.reload();
  114 |     await openCart(page);
  115 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  116 |     await expect(page.locator('[data-testid="cart-item"]')).toContainText('Physical Art');
  117 |   });
  118 | 
  119 |   test('should require shipping for mixed carts', async ({ page }) => {
  120 |     await addItem(page, 0);
  121 |     await addItem(page, 1);
  122 |     
  123 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2, { timeout: 15000 });
  124 | 
  125 |     await page.goto('/checkout');
  126 |     await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 20000 });
  127 |     await page.locator('#checkout-email').fill('mixed@example.com');
  128 |     await page.locator('#checkout-street').fill('123 Hive St');
  129 |     await page.locator('#checkout-city').fill('NY');
  130 |     await page.locator('#checkout-state').fill('NY');
  131 |     await page.locator('#checkout-zip').fill('10001');
  132 | 
  133 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  134 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
  135 |   });
  136 | 
  137 |   test('should block checkout if no shipping zone matches', async ({ page }) => {
  138 |     await addItem(page, 0);
  139 |     await page.goto('/checkout');
  140 |     
  141 |     await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 20000 });
  142 |     await page.locator('#checkout-email').fill('test@example.com');
  143 |     await page.locator('#checkout-street').fill('123 Foreign St');
  144 |     await page.locator('#checkout-city').fill('Toronto');
  145 |     await page.locator('#checkout-state').fill('ON');
  146 |     await page.locator('#checkout-zip').fill('M5V 2L7');
  147 |     
  148 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  149 |     await expect(page.getByText(/No matching zone/i)).toBeVisible({ timeout: 15000 });
  150 |   });
  151 | 
  152 |   test('should handle payment errors from API', async ({ page }) => {
  153 |     await page.route('/api/auth/me', async (route) => {
  154 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'fails@example.com' }) });
  155 |     });
  156 |     await page.route('/api/orders', async (route) => {
  157 |         if (route.request().method() === 'POST') {
  158 |             await route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ message: 'Insufficient funds.' }) });
  159 |         }
  160 |     });
  161 | 
  162 |     await addItem(page, 0);
  163 |     await page.goto('/checkout');
  164 |     await page.locator('#checkout-email').fill('fails@example.com');
  165 |     await page.locator('#checkout-street').fill('123 Hive St');
  166 |     await page.locator('#checkout-city').fill('NY');
  167 |     await page.locator('#checkout-state').fill('NY');
  168 |     await page.locator('#checkout-zip').fill('10001');
  169 |     
  170 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  171 |     await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
  172 |     
  173 |     await page.locator('[data-testid="mock-checkout-button"]').click({ force: true });
  174 |     await expect(page.locator('#checkout-error')).toContainText(/Insufficient funds/i, { timeout: 15000 });
  175 |   });
  176 | 
```