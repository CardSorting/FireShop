# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should calculate free shipping threshold milestones correctly
- Location: e2e/cart-checkout-comprehensive.spec.ts:131:3

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
  4   |  * [TEST SUITE: Comprehensive Commerce Flow]
  5   |  * Objective: Guarantee deterministic checkout behavior across all edge cases.
  6   |  */
  7   | 
  8   | test.describe('Comprehensive Cart and Checkout Flow', () => {
  9   |   
  10  |   test.beforeEach(async ({ page }) => {
  11  |     // 1. Reset state
  12  |     await page.addInitScript(() => {
  13  |       window.localStorage.clear();
  14  |       window.sessionStorage.clear();
  15  |     });
  16  | 
  17  |     // 2. Global Mocks (Base Layer)
  18  |     await page.route('/api/auth/me', async (route) => {
  19  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
  20  |     });
  21  | 
  22  |     await page.route('/api/admin/shipping/rates', async (route) => {
  23  |         await route.fulfill({
  24  |             status: 200,
  25  |             contentType: 'application/json',
  26  |             body: JSON.stringify([{ id: 'r1', name: 'Standard Shipping', amount: 599, type: 'price_based', minLimit: 0, maxLimit: 9999, shippingZoneId: 'z1' }])
  27  |         });
  28  |     });
  29  | 
  30  |     await page.route('/api/admin/shipping/zones', async (route) => {
  31  |         await route.fulfill({
  32  |             status: 200,
  33  |             contentType: 'application/json',
  34  |             body: JSON.stringify([{ id: 'z1', name: 'USA', countries: ['US'] }])
  35  |         });
  36  |     });
  37  | 
  38  |     await page.route('/api/taxonomy/categories', async (route) => {
  39  |         await route.fulfill({
  40  |             status: 200,
  41  |             contentType: 'application/json',
  42  |             body: JSON.stringify([{ id: 'c1', name: 'TCG', slug: 'tcg' }])
  43  |         });
  44  |     });
  45  | 
  46  |     await page.route('/api/products*', async (route) => {
  47  |         await route.fulfill({
  48  |             status: 200,
  49  |             contentType: 'application/json',
  50  |             body: JSON.stringify({
  51  |                 products: [
  52  |                     {
  53  |                         id: 'p1',
  54  |                         name: 'Black Lotus',
  55  |                         handle: 'black-lotus',
  56  |                         price: 5000,
  57  |                         imageUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400',
  58  |                         stock: 10,
  59  |                         category: 'TCG',
  60  |                         hasVariants: true,
  61  |                         options: [{ id: 'opt1', name: 'Finish', position: 1, values: ['Normal', 'Holographic'] }],
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
> 87  |     await page.goto('/products');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/products
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
```