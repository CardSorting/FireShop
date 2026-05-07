# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should block checkout if no shipping zone matches
- Location: e2e/cart-checkout-comprehensive.spec.ts:137:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#checkout-email')
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('#checkout-email')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Skip to main content" [ref=e3] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - img [ref=e8]
          - text: Free Shipping Over $50
        - generic [ref=e14]:
          - img [ref=e15]
          - text: Handcrafted by Indie Artists
      - generic [ref=e18]:
        - 'link "Support: 24/7 Experts" [ref=e19] [cursor=pointer]':
          - /url: /support
        - generic [ref=e21] [cursor=pointer]:
          - text: US / USD
          - img [ref=e22]
    - navigation [ref=e24]:
      - generic [ref=e26]:
        - generic [ref=e27]:
          - link "DreamBees Art" [ref=e28] [cursor=pointer]:
            - /url: /
            - img [ref=e31]
            - generic [ref=e44]: DreamBees Art
          - generic [ref=e46] [cursor=pointer]:
            - img [ref=e47]
            - generic [ref=e50]:
              - generic [ref=e51]: Search art, prints, accessories...
              - generic [ref=e53]: ⌘K
          - generic [ref=e54]:
            - generic [ref=e55]:
              - button "Shop" [ref=e56]:
                - text: Shop
                - img [ref=e57]
              - generic:
                - generic:
                  - generic:
                    - heading "Categories" [level=4]
                    - list:
                      - listitem:
                        - link "Artist Trading Cards":
                          - /url: /collections/artist-cards
                          - text: Artist Trading Cards
                          - img
                      - listitem:
                        - link "Art Prints":
                          - /url: /collections/prints
                          - text: Art Prints
                          - img
                      - listitem:
                        - link "TCG Accessories":
                          - /url: /collections/accessories
                          - text: TCG Accessories
                          - img
                  - generic:
                    - heading "Collections" [level=4]
                    - list:
                      - listitem:
                        - link "New Drops":
                          - /url: /collections/new
                          - text: New Drops
                          - img
                      - listitem:
                        - link "Bestsellers":
                          - /url: /collections/bestsellers
                          - text: Bestsellers
                          - img
                      - listitem:
                        - link "Sale":
                          - /url: /collections/sale
                          - text: Sale
                          - img
                - generic:
                  - link "Browse Complete Catalog":
                    - /url: /products
                    - text: Browse Complete Catalog
                    - img
            - link "All Products" [ref=e59] [cursor=pointer]:
              - /url: /products
            - link "Journal NEW" [ref=e60] [cursor=pointer]:
              - /url: /blog
              - text: Journal
              - generic [ref=e61]: NEW
        - generic [ref=e62]:
          - button "Open cart" [ref=e63]:
            - img [ref=e64]
            - generic [ref=e68]: Cart
          - link "Login" [ref=e70] [cursor=pointer]:
            - /url: /login
    - main [ref=e71]:
      - generic [ref=e74]:
        - img [ref=e76]
        - heading "Your cart is empty" [level=1] [ref=e79]
        - paragraph [ref=e80]: It looks like you haven't added any art to your cart yet. Let's find something special.
        - link "Browse Collections" [ref=e81] [cursor=pointer]:
          - /url: /products
    - contentinfo [ref=e82]:
      - button "Back to top":
        - img
      - generic [ref=e84]:
        - generic [ref=e85]:
          - generic [ref=e86]:
            - generic [ref=e87]:
              - img [ref=e88]
              - img [ref=e90]
              - img [ref=e92]
              - img [ref=e94]
              - img [ref=e96]
            - paragraph [ref=e98]: 4.9/5 Rating
            - paragraph [ref=e99]: From 10,000+ Collectors
          - generic [ref=e100]:
            - img [ref=e101]
            - paragraph [ref=e103]: Fast Shipping
            - paragraph [ref=e104]: 24h Order Processing
          - generic [ref=e105]:
            - img [ref=e106]
            - paragraph [ref=e109]: Indie Artists
            - paragraph [ref=e110]: 100% Creator Supported
          - generic [ref=e111]:
            - img [ref=e112]
            - paragraph [ref=e115]: Secure Pay
            - paragraph [ref=e116]: SSL Encrypted Checkout
        - generic [ref=e117]:
          - generic [ref=e118]:
            - generic [ref=e119]:
              - link "DreamBeesArt" [ref=e120] [cursor=pointer]:
                - /url: /
                - img [ref=e122]
                - text: DreamBeesArt
              - paragraph [ref=e135]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e136] [cursor=pointer]:
              - /url: /support
              - img [ref=e137]
              - generic [ref=e140]:
                - paragraph [ref=e141]: Need help?
                - paragraph [ref=e142]: 24/7 Expert Support
              - img [ref=e143]
          - generic [ref=e145]:
            - generic [ref=e146]:
              - heading "Shop" [level=3] [ref=e147]
              - list [ref=e148]:
                - listitem [ref=e149]:
                  - link "All Products" [ref=e150] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e151]:
                  - link "Journal & Strategy" [ref=e152] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e153]:
                  - link "Artist Trading Cards" [ref=e154] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e155]:
                  - link "Art Prints" [ref=e156] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e157]:
                  - link "TCG Accessories" [ref=e158] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e159]:
              - heading "Account" [level=3] [ref=e160]
              - list [ref=e161]:
                - listitem [ref=e162]:
                  - link "Sign In" [ref=e163] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e164]:
                  - link "Order History" [ref=e165] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e166]:
                  - link "Support Center" [ref=e167] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e168]:
          - img [ref=e171]
          - generic [ref=e184]:
            - heading "Join the Hive" [level=2] [ref=e185]
            - paragraph [ref=e186]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e187]:
              - textbox "honey@hive.com" [ref=e188]
              - button "Subscribe" [ref=e189]
        - generic [ref=e190]:
          - generic [ref=e192]:
            - img [ref=e193]
            - generic [ref=e196]: US / USD
            - img [ref=e197]
          - generic [ref=e199]:
            - img [ref=e200]
            - generic [ref=e202]: Mastercard
            - generic [ref=e203]: PayPal
            - generic [ref=e204]: Stripe
            - img [ref=e205]
          - generic [ref=e208]:
            - paragraph [ref=e209]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e210]: Fan Art & Artist-Inspired Merch
  - generic:
    - generic [ref=e213] [cursor=pointer]:
      - img [ref=e214]
      - generic [ref=e216]: 1 error
      - button "Hide Errors" [ref=e217]:
        - img [ref=e218]
    - status [ref=e221]:
      - generic [ref=e222]:
        - img [ref=e224]
        - generic [ref=e226]:
          - text: Static route
          - button "Hide static indicator" [ref=e227] [cursor=pointer]:
            - img [ref=e228]
  - alert [ref=e231]
```

# Test source

```ts
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
  76  |     await expect(cartBtn).toBeVisible({ timeout: 15000 });
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
> 141 |     await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 20000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
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
  177 |   test('should handle discount codes in checkout summary', async ({ page }) => {
  178 |     await addItem(page, 0);
  179 |     await page.goto('/checkout');
  180 |     
  181 |     await page.route('/api/discounts/validate', async (route) => {
  182 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } }) });
  183 |     });
  184 | 
  185 |     await page.locator('input[placeholder="Discount code"]').fill('SAVE10');
  186 |     await page.getByRole('button', { name: /Apply/i }).click({ force: true });
  187 |     
  188 |     await expect(page.getByText(/SAVE10 applied/i)).toBeVisible({ timeout: 10000 });
  189 |     await expect(page.getByText('-$10.00')).toBeVisible();
  190 |     
  191 |     await page.locator('button:has-text("Remove")').click({ force: true });
  192 |     await expect(page.getByText('-$10.00')).not.toBeVisible();
  193 |   });
  194 | 
  195 |   test('should enforce cart quantity cap', async ({ page }) => {
  196 |     await addItem(page, 0);
  197 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  198 |     const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
  199 |     
  200 |     for(let i = 0; i < 9; i++) {
  201 |         await plusBtn.click({ force: true });
  202 |         await page.waitForTimeout(200); // Wait for animation and state
  203 |     }
  204 |     
  205 |     await expect(cartItem.getByText('10')).toBeVisible({ timeout: 15000 });
  206 |     await expect(plusBtn).toBeDisabled({ timeout: 10000 });
  207 |   });
  208 | 
  209 |   test('should survive guest page reloads', async ({ page }) => {
  210 |     await addItem(page, 0);
  211 |     await page.reload();
  212 |     await openCart(page);
  213 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  214 |   });
  215 | 
  216 |   test('should maintain field data across checkout steps', async ({ page }) => {
  217 |     await addItem(page, 0);
  218 |     await page.goto('/checkout');
  219 |     await page.locator('#checkout-email').fill('step@example.com');
  220 |     await page.locator('#checkout-street').fill('123 Hive St');
  221 |     await page.locator('#checkout-city').fill('NY');
  222 |     await page.locator('#checkout-state').fill('NY');
  223 |     await page.locator('#checkout-zip').fill('10001');
  224 | 
  225 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  226 |     await page.locator('button:has-text("Edit Address")').click({ force: true });
  227 |     await expect(page.locator('#checkout-street')).toHaveValue('123 Hive St');
  228 |   });
  229 | 
  230 | });
  231 | 
```