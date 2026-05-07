# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should require shipping for mixed carts
- Location: e2e/cart-checkout-comprehensive.spec.ts:119:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[data-testid="cart-item"]')
Expected: 2
Received: 1
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" with timeout 15000ms
  - waiting for locator('[data-testid="cart-item"]')
    19 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - link "Skip to main content" [ref=e4] [cursor=pointer]:
      - /url: "#main-content"
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - img [ref=e9]
          - text: Free Shipping Over $50
        - generic [ref=e15]:
          - img [ref=e16]
          - text: Handcrafted by Indie Artists
      - generic [ref=e19]:
        - 'link "Support: 24/7 Experts" [ref=e20] [cursor=pointer]':
          - /url: /support
        - generic [ref=e22] [cursor=pointer]:
          - text: US / USD
          - img [ref=e23]
    - navigation [ref=e25]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - link "DreamBees Art" [ref=e30] [cursor=pointer]:
            - /url: /
            - img [ref=e33]
            - generic [ref=e46]: DreamBees Art
          - generic [ref=e48] [cursor=pointer]:
            - img [ref=e49]
            - generic [ref=e52]:
              - generic [ref=e53]: Search art, prints, accessories...
              - generic [ref=e55]: ⌘K
          - generic [ref=e56]:
            - generic [ref=e57]:
              - button "Shop" [ref=e58]:
                - text: Shop
                - img [ref=e59]
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
            - link "All Products" [ref=e61] [cursor=pointer]:
              - /url: /products
            - link "Journal NEW" [ref=e62] [cursor=pointer]:
              - /url: /blog
              - text: Journal
              - generic [ref=e63]: NEW
        - generic [ref=e64]:
          - button "Open cart" [ref=e65]:
            - img [ref=e66]
            - generic [ref=e70]: Cart
            - generic [ref=e71]: "1"
          - link "Login" [ref=e73] [cursor=pointer]:
            - /url: /login
    - main [ref=e74]:
      - generic [ref=e77]:
        - navigation "Breadcrumb" [ref=e78]:
          - list [ref=e79]:
            - listitem [ref=e80]:
              - link "Home" [ref=e81] [cursor=pointer]:
                - /url: /
                - img [ref=e82]
                - generic [ref=e85]: Home
            - listitem [ref=e86]:
              - img [ref=e87]
              - generic [ref=e89]: Catalog
        - generic [ref=e90]:
          - heading "The Catalog" [level=1] [ref=e91]
          - paragraph [ref=e93]: Browse our curated collection of artist trading cards, prints, and TCG accessories. Every item is handcrafted by independent creators.
        - generic [ref=e94]:
          - generic [ref=e95]:
            - img [ref=e96]
            - textbox "Search catalog..." [ref=e99]
          - generic [ref=e100]:
            - button "Filters" [ref=e101]:
              - img [ref=e102]
              - text: Filters
            - generic [ref=e104]:
              - combobox [ref=e105] [cursor=pointer]:
                - 'option "Sort By: Newest" [selected]'
                - 'option "Sort By: Price Low-High"'
                - 'option "Sort By: Price High-Low"'
                - 'option "Sort By: Alphabetical"'
              - img
            - generic [ref=e106]:
              - button "2-column grid view" [ref=e107]:
                - img [ref=e108]
              - button "3-column grid view" [ref=e110]:
                - img [ref=e111]
              - button "4-column grid view" [ref=e113]:
                - img [ref=e114]
        - generic [ref=e119]:
          - complementary [ref=e120]:
            - generic [ref=e121]:
              - heading "Product Type" [level=3] [ref=e122]
              - generic [ref=e123]:
                - generic [ref=e124] [cursor=pointer]:
                  - checkbox "Accessories" [ref=e125]
                  - generic [ref=e126]: Accessories
                - generic [ref=e127] [cursor=pointer]:
                  - checkbox "Trading Cards" [ref=e128]
                  - generic [ref=e129]: Trading Cards
            - generic [ref=e130]:
              - heading "Condition" [level=3] [ref=e131]
              - generic [ref=e132]:
                - generic [ref=e133] [cursor=pointer]:
                  - checkbox "New" [ref=e134]
                  - generic [ref=e135]: New
                - generic [ref=e136] [cursor=pointer]:
                  - checkbox "Like New" [ref=e137]
                  - generic [ref=e138]: Like New
                - generic [ref=e139] [cursor=pointer]:
                  - checkbox "Gently Used" [ref=e140]
                  - generic [ref=e141]: Gently Used
                - generic [ref=e142] [cursor=pointer]:
                  - checkbox "Vintage" [ref=e143]
                  - generic [ref=e144]: Vintage
            - generic [ref=e145]:
              - heading "Availability" [level=3] [ref=e146]
              - generic [ref=e147]:
                - generic [ref=e148] [cursor=pointer]:
                  - checkbox "In Stock" [ref=e149]
                  - generic [ref=e150]: In Stock
                - generic [ref=e151] [cursor=pointer]:
                  - checkbox "Out of Stock" [ref=e152]
                  - generic [ref=e153]: Out of Stock
            - generic [ref=e154]:
              - heading "Price Range" [level=3] [ref=e155]
              - generic [ref=e157]:
                - generic [ref=e158]:
                  - paragraph [ref=e159]: Min
                  - spinbutton [ref=e160]: "0"
                - generic [ref=e161]:
                  - paragraph [ref=e162]: Max
                  - spinbutton [ref=e163]: "100000"
            - button "Clear All Filters" [ref=e164]
          - generic [ref=e165]:
            - paragraph [ref=e167]: Showing 2 items
            - generic [ref=e168]:
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - link "View Physical Art" [ref=e172] [cursor=pointer]:
                    - /url: /products/physical-art
                    - img "Physical Art - Handcrafted Art" [ref=e173]
                  - button "Add to wishlist" [ref=e174]:
                    - img [ref=e175]
                  - generic [ref=e177]:
                    - button "Add Physical Art to cart" [ref=e178]:
                      - img [ref=e179]
                      - text: Quick Add
                    - button "Quick View" [ref=e183]:
                      - img [ref=e184]
                - generic [ref=e187]:
                  - generic [ref=e189]:
                    - generic [ref=e190]: Art
                    - generic [ref=e192]: Handcrafted
                  - heading "Physical Art" [level=3] [ref=e193]:
                    - link "Physical Art" [ref=e194] [cursor=pointer]:
                      - /url: /products/physical-art
                  - generic [ref=e196]:
                    - paragraph [ref=e197]: $50.00
                    - img [ref=e198]
              - generic [ref=e201]:
                - generic [ref=e202]:
                  - link "View Digital Art" [ref=e203] [cursor=pointer]:
                    - /url: /products/digital-art
                    - img "Digital Art - Handcrafted Art" [ref=e204]
                  - button "Add to wishlist" [ref=e205]:
                    - img [ref=e206]
                  - generic [ref=e208]:
                    - button "Add Digital Art to cart" [ref=e209]:
                      - img [ref=e210]
                      - text: Quick Add
                    - button "Quick View" [ref=e214]:
                      - img [ref=e215]
                - generic [ref=e218]:
                  - generic [ref=e220]:
                    - generic [ref=e221]: Art
                    - generic [ref=e223]: Handcrafted
                  - heading "Digital Art" [level=3] [ref=e224]:
                    - link "Digital Art" [ref=e225] [cursor=pointer]:
                      - /url: /products/digital-art
                  - generic [ref=e227]:
                    - paragraph [ref=e228]: $20.00
                    - img [ref=e229]
    - contentinfo [ref=e231]:
      - button "Back to top":
        - img
      - generic [ref=e233]:
        - generic [ref=e234]:
          - generic [ref=e235]:
            - generic [ref=e236]:
              - img [ref=e237]
              - img [ref=e239]
              - img [ref=e241]
              - img [ref=e243]
              - img [ref=e245]
            - paragraph [ref=e247]: 4.9/5 Rating
            - paragraph [ref=e248]: From 10,000+ Collectors
          - generic [ref=e249]:
            - img [ref=e250]
            - paragraph [ref=e252]: Fast Shipping
            - paragraph [ref=e253]: 24h Order Processing
          - generic [ref=e254]:
            - img [ref=e255]
            - paragraph [ref=e258]: Indie Artists
            - paragraph [ref=e259]: 100% Creator Supported
          - generic [ref=e260]:
            - img [ref=e261]
            - paragraph [ref=e264]: Secure Pay
            - paragraph [ref=e265]: SSL Encrypted Checkout
        - generic [ref=e266]:
          - generic [ref=e267]:
            - generic [ref=e268]:
              - link "DreamBeesArt" [ref=e269] [cursor=pointer]:
                - /url: /
                - img [ref=e271]
                - text: DreamBeesArt
              - paragraph [ref=e284]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e285] [cursor=pointer]:
              - /url: /support
              - img [ref=e286]
              - generic [ref=e289]:
                - paragraph [ref=e290]: Need help?
                - paragraph [ref=e291]: 24/7 Expert Support
              - img [ref=e292]
          - generic [ref=e294]:
            - generic [ref=e295]:
              - heading "Shop" [level=3] [ref=e296]
              - list [ref=e297]:
                - listitem [ref=e298]:
                  - link "All Products" [ref=e299] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e300]:
                  - link "Journal & Strategy" [ref=e301] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e302]:
                  - link "Artist Trading Cards" [ref=e303] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e304]:
                  - link "Art Prints" [ref=e305] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e306]:
                  - link "TCG Accessories" [ref=e307] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e308]:
              - heading "Account" [level=3] [ref=e309]
              - list [ref=e310]:
                - listitem [ref=e311]:
                  - link "Sign In" [ref=e312] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e313]:
                  - link "Order History" [ref=e314] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e315]:
                  - link "Support Center" [ref=e316] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e317]:
          - img [ref=e320]
          - generic [ref=e333]:
            - heading "Join the Hive" [level=2] [ref=e334]
            - paragraph [ref=e335]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e336]:
              - textbox "honey@hive.com" [ref=e337]
              - button "Subscribe" [ref=e338]
        - generic [ref=e339]:
          - generic [ref=e341]:
            - img [ref=e342]
            - generic [ref=e345]: US / USD
            - img [ref=e346]
          - generic [ref=e348]:
            - img [ref=e349]
            - generic [ref=e351]: Mastercard
            - generic [ref=e352]: PayPal
            - generic [ref=e353]: Stripe
            - img [ref=e354]
          - generic [ref=e357]:
            - paragraph [ref=e358]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e359]: Fan Art & Artist-Inspired Merch
  - status [ref=e360]:
    - generic [ref=e361]:
      - img [ref=e363]
      - generic [ref=e365]:
        - text: Static route
        - button "Hide static indicator" [ref=e366] [cursor=pointer]:
          - img [ref=e367]
  - alert [ref=e370]
  - generic [ref=e373]:
    - generic [ref=e374]:
      - generic [ref=e375]:
        - heading "Cart" [level=2] [ref=e376]
        - generic [ref=e378]: 1 item
      - button "Close cart" [active] [ref=e379]:
        - img [ref=e380]
    - generic [ref=e384]:
      - generic [ref=e385]:
        - img [ref=e386]
        - generic [ref=e391]: Shipping Progress
      - generic [ref=e392]: $80.00 to go
    - generic [ref=e396]:
      - generic [ref=e397]:
        - img "Digital Art" [ref=e399]
        - generic [ref=e400]:
          - generic [ref=e401]:
            - generic [ref=e402]:
              - heading "Digital Art" [level=3] [ref=e403]:
                - link "Digital Art" [ref=e404] [cursor=pointer]:
                  - /url: /products/p2
              - button "Remove item" [ref=e406]:
                - img [ref=e407]
            - generic [ref=e411]: $20.00
          - generic [ref=e412]:
            - generic [ref=e413]:
              - button [disabled] [ref=e414]:
                - img [ref=e415]
              - generic [ref=e416]: "1"
              - button [ref=e417]:
                - img [ref=e418]
            - paragraph [ref=e419]: $20.00
      - group [ref=e421]:
        - generic "Add a gift note or instructions" [ref=e422] [cursor=pointer]:
          - generic [ref=e423]: Add a gift note or instructions
          - img [ref=e424]
    - generic [ref=e426]:
      - generic [ref=e427]:
        - generic [ref=e428]:
          - generic [ref=e429]: Total
          - generic [ref=e430]: $20.00
        - link "Checkout" [ref=e431] [cursor=pointer]:
          - /url: /checkout
          - text: Checkout
          - img [ref=e432]
      - generic [ref=e434]:
        - generic [ref=e435]:
          - img [ref=e436]
          - img [ref=e439]
        - paragraph [ref=e443]: Secure SSL
```

# Test source

```ts
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
> 123 |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(2, { timeout: 15000 });
      |                                                             ^ Error: expect(locator).toHaveCount(expected) failed
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
```