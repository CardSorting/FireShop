# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should block checkout for unsupported shipping countries
- Location: e2e/cart-checkout-comprehensive.spec.ts:104:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.fill: Test timeout of 60000ms exceeded.
Call log:
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
  7   | 
  8   | test.describe('Comprehensive Cart and Checkout Flow', () => {
  9   |   
  10  |   test.beforeEach(async ({ page }) => {
  11  |     test.setTimeout(60000);
  12  |     await setupBaseMocks(page);
  13  |   });
  14  | 
  15  |   async function setupBaseMocks(page: Page) {
  16  |     await page.route('/api/auth/me', async (route) => {
  17  |       await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(null) });
  18  |     });
  19  | 
  20  |     await page.route('/api/admin/shipping/rates', async (route) => {
  21  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'r1', name: 'Standard Shipping', amount: 599, type: 'price_based', minLimit: 0, maxLimit: 9999, shippingZoneId: 'z1' }]) });
  22  |     });
  23  |     await page.route('/api/admin/shipping/zones', async (route) => {
  24  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'z1', name: 'USA', countries: ['US'] }]) });
  25  |     });
  26  | 
  27  |     await page.route('/api/products*', async (route) => {
  28  |         await route.fulfill({
  29  |             status: 200,
  30  |             contentType: 'application/json',
  31  |             body: JSON.stringify({
  32  |                 products: [
  33  |                     { id: 'p1', name: 'Physical Art', handle: 'physical-art', price: 5000, stock: 10, category: 'Art', isDigital: false, imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400' },
  34  |                     { id: 'p2', name: 'Digital Art', handle: 'digital-art', price: 2000, stock: 999, category: 'Art', isDigital: true, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400' }
  35  |                 ],
  36  |                 nextCursor: null
  37  |             })
  38  |         });
  39  |     });
  40  | 
  41  |     await page.route('/api/cart*', async (route) => {
  42  |         const url = route.request().url();
  43  |         const items = [];
  44  |         // Support stateful-like behavior via URL hints or default to p1
  45  |         items.push({ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' });
  46  |         if (url.includes('mixed')) {
  47  |              items.push({ productId: 'p2', name: 'Digital Art', priceSnapshot: 2000, quantity: 1, imageUrl: '...' });
  48  |         }
  49  |         await route.fulfill({
  50  |             status: 200,
  51  |             contentType: 'application/json',
  52  |             body: JSON.stringify({ id: 'cart-v8', items, updatedAt: new Date().toISOString() })
  53  |         });
  54  |     });
  55  |   }
  56  | 
  57  |   /**
  58  |    * Directly populates the guest cart in localStorage to ensure deterministic checkout state.
  59  |    */
  60  |   async function seedCart(page: Page, items: any[]) {
  61  |     await page.goto('/'); // Need to be on the domain to set localStorage
  62  |     await page.evaluate((seededItems) => {
  63  |       const cart = {
  64  |         id: 'seeded-cart',
  65  |         userId: 'guest',
  66  |         items: seededItems,
  67  |         updatedAt: new Date()
  68  |       };
  69  |       localStorage.setItem('dreambees_guest_cart', JSON.stringify(cart));
  70  |     }, items);
  71  |   }
  72  | 
  73  |   // --- TESTS ---
  74  | 
  75  |   test('should merge guest cart into auth session', async ({ page }) => {
  76  |     await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
  77  |     await page.route('/api/auth/me', async (route) => {
  78  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@example.com' }) });
  79  |     });
  80  |     await page.goto('/products');
  81  |     await page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first().click({ force: true });
  82  |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  83  |   });
  84  | 
  85  |   test('should require shipping for mixed carts', async ({ page }) => {
  86  |     await seedCart(page, [
  87  |         { productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' },
  88  |         { productId: 'p2', name: 'Digital Art', priceSnapshot: 2000, quantity: 1, imageUrl: '...' }
  89  |     ]);
  90  |     
  91  |     // Hint to the cart mock to return both items
  92  |     await page.goto('/checkout?mixed=true');
  93  |     await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 15000 });
  94  |     await page.locator('#checkout-email').fill('mixed@example.com');
  95  |     await page.locator('#checkout-street').fill('123 Hive St');
  96  |     await page.locator('#checkout-city').fill('NY');
  97  |     await page.locator('#checkout-state').fill('NY');
  98  |     await page.locator('#checkout-zip').fill('10001');
  99  | 
  100 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  101 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
  102 |   });
  103 | 
  104 |   test('should block checkout for unsupported shipping countries', async ({ page }) => {
  105 |     await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
  106 |     await page.goto('/checkout');
> 107 |     await page.locator('#checkout-email').fill('test@example.com');
      |                                           ^ Error: locator.fill: Test timeout of 60000ms exceeded.
  108 |     await page.locator('#checkout-street').fill('123 Foreign St');
  109 |     await page.locator('#checkout-city').fill('Toronto');
  110 |     await page.locator('#checkout-state').fill('ON');
  111 |     await page.locator('#checkout-zip').fill('M5V 2L7');
  112 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  113 |     await expect(page.getByText(/No matching zone/i)).toBeVisible({ timeout: 15000 });
  114 |   });
  115 | 
  116 |   test('should handle payment errors', async ({ page }) => {
  117 |     await page.route('/api/auth/me', async (route) => {
  118 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@example.com' }) });
  119 |     });
  120 |     await page.route('/api/orders', async (route) => {
  121 |         if (route.request().method() === 'POST') {
  122 |             await route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ message: 'Insufficient funds.' }) });
  123 |         }
  124 |     });
  125 | 
  126 |     await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
  127 |     await page.goto('/checkout');
  128 |     
  129 |     // Auth users have read-only email
  130 |     await expect(page.locator('#checkout-email')).toHaveValue('test@example.com');
  131 |     await page.locator('#checkout-street').fill('123 Test St');
  132 |     await page.locator('#checkout-city').fill('Test City');
  133 |     await page.locator('#checkout-state').fill('TS');
  134 |     await page.locator('#checkout-zip').fill('12345');
  135 |     
  136 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  137 |     await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
  138 |     await page.locator('[data-testid="mock-checkout-button"]').click({ force: true });
  139 |     await expect(page.locator('#checkout-error')).toContainText(/Insufficient funds/i, { timeout: 20000 });
  140 |   });
  141 | 
  142 |   test('should apply discount codes', async ({ page }) => {
  143 |     await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
  144 |     await page.goto('/checkout');
  145 |     await page.route('/api/discounts/validate', async (route) => {
  146 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } }) });
  147 |     });
  148 |     await page.locator('input[placeholder="Discount code"]').fill('SAVE10');
  149 |     await page.getByRole('button', { name: /Apply/i }).click({ force: true });
  150 |     await expect(page.getByText(/SAVE10 applied/i)).toBeVisible({ timeout: 15000 });
  151 |   });
  152 | 
  153 |   test('should enforce quantity limits', async ({ page }) => {
  154 |     await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
  155 |     await page.goto('/products');
  156 |     await page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first().click({ force: true });
  157 |     
  158 |     const plusBtn = page.locator('button:has(svg.lucide-plus)');
  159 |     for(let i = 0; i < 9; i++) {
  160 |         await plusBtn.click({ force: true });
  161 |     }
  162 |     await expect(page.getByText('10')).toBeVisible({ timeout: 10000 });
  163 |     await expect(plusBtn).toBeDisabled({ timeout: 5000 });
  164 |   });
  165 | 
  166 |   test('should persist cart after reload', async ({ page }) => {
  167 |     await seedCart(page, [{ productId: 'p1', name: 'Physical Art', priceSnapshot: 5000, quantity: 1, imageUrl: '...' }]);
  168 |     await page.goto('/products');
  169 |     await page.reload();
  170 |     await page.locator('button[aria-label="Open cart"]').filter({ visible: true }).first().click({ force: true });
  171 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  172 |   });
  173 | 
  174 | });
  175 | 
```