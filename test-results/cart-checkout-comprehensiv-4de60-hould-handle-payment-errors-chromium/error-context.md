# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should handle payment errors
- Location: e2e/cart-checkout-comprehensive.spec.ts:116:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-testid="mock-checkout-button"]')

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
          - link "View favorites" [ref=e63] [cursor=pointer]:
            - /url: /wishlist
            - img [ref=e64]
          - button "Open cart" [ref=e66]:
            - img [ref=e67]
            - generic [ref=e71]: Cart
            - generic [ref=e72]: "1"
          - generic [ref=e74]:
            - button "Sign Out" [ref=e76]
            - link [ref=e77] [cursor=pointer]:
              - /url: /account
              - img [ref=e78]
    - main [ref=e81]:
      - generic [ref=e83]:
        - generic [ref=e85]:
          - link "DreamBeesArt" [ref=e86] [cursor=pointer]:
            - /url: /
          - generic [ref=e87]:
            - generic [ref=e88]:
              - img [ref=e89]
              - generic [ref=e93]: AES-256 SSL Secure
            - link "Help" [ref=e94] [cursor=pointer]:
              - /url: /contact
        - generic [ref=e95]:
          - main [ref=e96]:
            - navigation "Progress" [ref=e97]:
              - list [ref=e98]:
                - listitem [ref=e99]:
                  - generic [ref=e100]:
                    - button [ref=e101]:
                      - img [ref=e103]
                    - generic [ref=e105]: Information
                - listitem [ref=e108]:
                  - generic [ref=e109]:
                    - button [ref=e110]:
                      - img [ref=e112]
                    - generic [ref=e114]: Shipping
                - listitem [ref=e117]:
                  - generic [ref=e118]:
                    - button [ref=e119]
                    - generic [ref=e122]: Payment
            - generic [ref=e123]:
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - generic [ref=e126]:
                    - generic [ref=e127]:
                      - generic [ref=e128]: Identity
                      - generic [ref=e129]: test@example.com
                    - button "Change" [ref=e130]
                  - generic [ref=e131]:
                    - generic [ref=e132]:
                      - generic [ref=e133]: Ship to
                      - generic [ref=e134]: 123 Test St, Test City, TS 12345
                    - button "Change" [ref=e135]
                  - generic [ref=e136]:
                    - generic [ref=e137]:
                      - generic [ref=e138]: Method
                      - generic [ref=e139]: Standard Shipping • $5.99
                    - button "Change" [ref=e140]
                - generic [ref=e141]:
                  - generic [ref=e142]:
                    - heading "Secure Payment" [level=1] [ref=e143]
                    - generic [ref=e144]:
                      - img [ref=e145]
                      - img [ref=e147]
                  - generic [ref=e150]:
                    - generic [ref=e151]:
                      - paragraph [ref=e152]: Order Commitment
                      - generic [ref=e153]:
                        - generic [ref=e154]: 1 Items ready for shipment
                        - generic [ref=e155]: $55.99
                    - generic [ref=e157]:
                      - generic [ref=e158]:
                        - heading "Payment details" [level=2] [ref=e159]:
                          - img [ref=e160]
                          - text: Payment details
                        - generic [ref=e162]:
                          - generic [ref=e163]: VISA
                          - generic [ref=e164]: MC
                          - generic [ref=e165]: AMEX
                      - generic [ref=e168]:
                        - iframe [ref=e169]:
                          - generic [ref=f2e1]:
                            - generic: 0123456789０１２３４５６７８９
                            - textbox [disabled]
                            - generic [ref=f2e2]:
                              - generic:
                                - generic:
                                  - generic:
                                    - generic:
                                      - img
                                    - generic:
                                      - img
                              - generic [ref=f2e3]:
                                - generic [ref=f2e4]:
                                  - generic: Number
                                  - generic [ref=f2e6]:
                                    - generic:
                                      - generic:
                                        - generic:
                                          - generic:
                                            - img
                                          - generic:
                                            - img
                                    - textbox "Credit or debit card number" [ref=f2e9]:
                                      - /placeholder: Card number
                                - generic:
                                  - generic:
                                    - generic:
                                      - generic:
                                        - textbox:
                                          - /placeholder: MM / YY
                                  - generic:
                                    - generic:
                                      - generic:
                                        - textbox:
                                          - /placeholder: CVC
                            - textbox [disabled]
                            - button
                        - textbox
                        - iframe [ref=e171]:
                          - button "Autofill with Link" [ref=f6e3] [cursor=pointer]:
                            - generic [ref=f6e4]: Use
                            - img [ref=f6e5]
                      - button "Pay & Place Order" [ref=e172]:
                        - text: Pay & Place Order
                        - img [ref=e173]
                      - generic [ref=e177]:
                        - generic [ref=e178]:
                          - img [ref=e179]
                          - text: SSL SECURE
                        - generic [ref=e183]:
                          - img [ref=e184]
                          - text: ENCRYPTED
                        - generic [ref=e189]: STRIPE VERIFIED
                - generic [ref=e191]:
                  - generic [ref=e192]:
                    - img [ref=e193]
                    - generic [ref=e196]: PCI-DSS
                  - generic [ref=e197]:
                    - img [ref=e198]
                    - generic [ref=e201]: Secure Cloud
                  - generic [ref=e202]:
                    - img [ref=e203]
                    - generic [ref=e206]: Verified Auth
                - button "Back to Shipping" [ref=e207]:
                  - img [ref=e208]
                  - text: Back to Shipping
              - generic [ref=e210]:
                - generic [ref=e211]:
                  - link "Returns" [ref=e212] [cursor=pointer]:
                    - /url: /refund-policy
                  - link "Shipping" [ref=e213] [cursor=pointer]:
                    - /url: /shipping-policy
                  - link "Privacy" [ref=e214] [cursor=pointer]:
                    - /url: /privacy-policy
                  - link "Terms" [ref=e215] [cursor=pointer]:
                    - /url: /terms
                - paragraph [ref=e216]: © 2026 DreamBeesArt. Industrialized E-commerce Flow.
          - complementary [ref=e217]:
            - generic [ref=e218]:
              - generic [ref=e219]:
                - generic [ref=e220]:
                  - heading "Order Summary" [level=2] [ref=e221]
                  - generic [ref=e222]: 1 Item
                - generic [ref=e224]:
                  - generic [ref=e225]:
                    - img "Physical Art" [ref=e226]
                    - generic [ref=e227]: "1"
                  - generic [ref=e228]:
                    - paragraph [ref=e229]: Physical Art
                    - paragraph [ref=e230]: Collector Unit • $50.00
                  - paragraph [ref=e231]: $50.00
                - generic [ref=e233]:
                  - generic [ref=e234]:
                    - img
                    - textbox "Discount code" [ref=e235]
                  - button "Apply" [disabled] [ref=e236]
                - generic [ref=e237]:
                  - generic [ref=e238]:
                    - generic [ref=e239]: Subtotal
                    - generic [ref=e240]: $50.00
                  - generic [ref=e241]:
                    - generic [ref=e242]: Standard Shipping
                    - generic [ref=e243]: $5.99
                  - generic [ref=e244]:
                    - generic [ref=e245]: Estimated Tax
                    - generic [ref=e246]: Calculated at next step
                  - generic [ref=e247]:
                    - generic [ref=e248]: Total Due
                    - generic [ref=e249]: USD$55.99
              - generic [ref=e251]:
                - img [ref=e253]
                - generic [ref=e258]:
                  - paragraph [ref=e259]: Unlock Free Shipping
                  - paragraph [ref=e260]: Add $50.00 more to your cart.
              - generic [ref=e261]:
                - generic [ref=e262]:
                  - img [ref=e264]
                  - generic [ref=e267]:
                    - paragraph [ref=e268]: Artist Quality
                    - paragraph [ref=e269]: All products directly support independent artists.
                - generic [ref=e270]:
                  - img [ref=e272]
                  - generic [ref=e277]:
                    - paragraph [ref=e278]: Collector-First Packing
                    - paragraph [ref=e279]: Sleeved and bubble-wrapped for maximum protection.
                - generic [ref=e280]:
                  - img [ref=e282]
                  - generic [ref=e285]:
                    - paragraph [ref=e286]: Premium Support
                    - paragraph [ref=e287]: Priority assistance for all orders over $50.
    - contentinfo [ref=e288]:
      - button "Back to top":
        - img
      - generic [ref=e290]:
        - generic [ref=e291]:
          - generic [ref=e292]:
            - generic [ref=e293]:
              - img [ref=e294]
              - img [ref=e296]
              - img [ref=e298]
              - img [ref=e300]
              - img [ref=e302]
            - paragraph [ref=e304]: 4.9/5 Rating
            - paragraph [ref=e305]: From 10,000+ Collectors
          - generic [ref=e306]:
            - img [ref=e307]
            - paragraph [ref=e309]: Fast Shipping
            - paragraph [ref=e310]: 24h Order Processing
          - generic [ref=e311]:
            - img [ref=e312]
            - paragraph [ref=e315]: Indie Artists
            - paragraph [ref=e316]: 100% Creator Supported
          - generic [ref=e317]:
            - img [ref=e318]
            - paragraph [ref=e321]: Secure Pay
            - paragraph [ref=e322]: SSL Encrypted Checkout
        - generic [ref=e323]:
          - generic [ref=e324]:
            - generic [ref=e325]:
              - link "DreamBeesArt" [ref=e326] [cursor=pointer]:
                - /url: /
                - img [ref=e328]
                - text: DreamBeesArt
              - paragraph [ref=e341]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e342] [cursor=pointer]:
              - /url: /support
              - img [ref=e343]
              - generic [ref=e346]:
                - paragraph [ref=e347]: Need help?
                - paragraph [ref=e348]: 24/7 Expert Support
              - img [ref=e349]
          - generic [ref=e351]:
            - generic [ref=e352]:
              - heading "Shop" [level=3] [ref=e353]
              - list [ref=e354]:
                - listitem [ref=e355]:
                  - link "All Products" [ref=e356] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e357]:
                  - link "Journal & Strategy" [ref=e358] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e359]:
                  - link "Artist Trading Cards" [ref=e360] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e361]:
                  - link "Art Prints" [ref=e362] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e363]:
                  - link "TCG Accessories" [ref=e364] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e365]:
              - heading "Account" [level=3] [ref=e366]
              - list [ref=e367]:
                - listitem [ref=e368]:
                  - link "Sign In" [ref=e369] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e370]:
                  - link "Order History" [ref=e371] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e372]:
                  - link "Support Center" [ref=e373] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e374]:
          - img [ref=e377]
          - generic [ref=e390]:
            - heading "Join the Hive" [level=2] [ref=e391]
            - paragraph [ref=e392]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e393]:
              - textbox "honey@hive.com" [ref=e394]
              - button "Subscribe" [ref=e395]
        - generic [ref=e396]:
          - generic [ref=e398]:
            - img [ref=e399]
            - generic [ref=e402]: US / USD
            - img [ref=e403]
          - generic [ref=e405]:
            - img [ref=e406]
            - generic [ref=e408]: Mastercard
            - generic [ref=e409]: PayPal
            - generic [ref=e410]: Stripe
            - img [ref=e411]
          - generic [ref=e414]:
            - paragraph [ref=e415]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e416]: Fan Art & Artist-Inspired Merch
  - generic:
    - generic [ref=e419] [cursor=pointer]:
      - img [ref=e420]
      - generic [ref=e422]: 2 errors
      - button "Hide Errors" [ref=e423]:
        - img [ref=e424]
    - status [ref=e427]:
      - generic [ref=e428]:
        - img [ref=e430]
        - generic [ref=e432]:
          - text: Static route
          - button "Hide static indicator" [ref=e433] [cursor=pointer]:
            - img [ref=e434]
  - alert [ref=e437]
```

# Test source

```ts
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
  107 |     await page.locator('#checkout-email').fill('test@example.com');
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
> 138 |     await page.locator('[data-testid="mock-checkout-button"]').click({ force: true });
      |                                                                ^ Error: locator.click: Test timeout of 60000ms exceeded.
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