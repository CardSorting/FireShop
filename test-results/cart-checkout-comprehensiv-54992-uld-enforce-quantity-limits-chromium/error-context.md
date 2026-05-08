# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should enforce quantity limits
- Location: e2e/cart-checkout-comprehensive.spec.ts:153:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button:has(svg.lucide-plus)')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - navigation "Breadcrumb" [ref=e75]:
          - list [ref=e76]:
            - listitem [ref=e77]:
              - link "Home" [ref=e78] [cursor=pointer]:
                - /url: /
                - img [ref=e79]
                - generic [ref=e82]: Home
            - listitem [ref=e83]:
              - img [ref=e84]
              - generic [ref=e86]: Catalog
        - generic [ref=e87]:
          - heading "The Catalog" [level=1] [ref=e88]
          - paragraph [ref=e90]: Browse our curated collection of artist trading cards, prints, and TCG accessories. Every item is handcrafted by independent creators.
        - generic [ref=e91]:
          - generic [ref=e92]:
            - img [ref=e93]
            - textbox "Search catalog..." [ref=e96]
          - generic [ref=e97]:
            - button "Filters" [ref=e98]:
              - img [ref=e99]
              - text: Filters
            - generic [ref=e101]:
              - combobox [ref=e102] [cursor=pointer]:
                - 'option "Sort By: Newest" [selected]'
                - 'option "Sort By: Price Low-High"'
                - 'option "Sort By: Price High-Low"'
                - 'option "Sort By: Alphabetical"'
              - img
            - generic [ref=e103]:
              - button "2-column grid view" [ref=e104]:
                - img [ref=e105]
              - button "3-column grid view" [ref=e107]:
                - img [ref=e108]
              - button "4-column grid view" [ref=e110]:
                - img [ref=e111]
        - generic [ref=e116]:
          - complementary [ref=e117]:
            - generic [ref=e118]:
              - heading "Product Type" [level=3] [ref=e119]
              - generic [ref=e120]:
                - generic [ref=e121] [cursor=pointer]:
                  - checkbox "Accessories" [ref=e122]
                  - generic [ref=e123]: Accessories
                - generic [ref=e124] [cursor=pointer]:
                  - checkbox "Trading Cards" [ref=e125]
                  - generic [ref=e126]: Trading Cards
            - generic [ref=e127]:
              - heading "Condition" [level=3] [ref=e128]
              - generic [ref=e129]:
                - generic [ref=e130] [cursor=pointer]:
                  - checkbox "New" [ref=e131]
                  - generic [ref=e132]: New
                - generic [ref=e133] [cursor=pointer]:
                  - checkbox "Like New" [ref=e134]
                  - generic [ref=e135]: Like New
                - generic [ref=e136] [cursor=pointer]:
                  - checkbox "Gently Used" [ref=e137]
                  - generic [ref=e138]: Gently Used
                - generic [ref=e139] [cursor=pointer]:
                  - checkbox "Vintage" [ref=e140]
                  - generic [ref=e141]: Vintage
            - generic [ref=e142]:
              - heading "Availability" [level=3] [ref=e143]
              - generic [ref=e144]:
                - generic [ref=e145] [cursor=pointer]:
                  - checkbox "In Stock" [ref=e146]
                  - generic [ref=e147]: In Stock
                - generic [ref=e148] [cursor=pointer]:
                  - checkbox "Out of Stock" [ref=e149]
                  - generic [ref=e150]: Out of Stock
            - generic [ref=e151]:
              - heading "Price Range" [level=3] [ref=e152]
              - generic [ref=e154]:
                - generic [ref=e155]:
                  - paragraph [ref=e156]: Min
                  - spinbutton [ref=e157]: "0"
                - generic [ref=e158]:
                  - paragraph [ref=e159]: Max
                  - spinbutton [ref=e160]: "100000"
            - button "Clear All Filters" [ref=e161]
          - generic [ref=e162]:
            - paragraph [ref=e164]: Showing 2 items
            - generic [ref=e165]:
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - link "View Physical Art" [ref=e169] [cursor=pointer]:
                    - /url: /products/physical-art
                    - img "Physical Art - Handcrafted Art" [ref=e170]
                  - button "Add to wishlist" [ref=e171]:
                    - img [ref=e172]
                  - generic [ref=e174]:
                    - button "Add Physical Art to cart" [ref=e175]:
                      - img [ref=e176]
                      - text: Quick Add
                    - button "Quick View" [ref=e180]:
                      - img [ref=e181]
                - generic [ref=e184]:
                  - generic [ref=e186]:
                    - generic [ref=e187]: Art
                    - generic [ref=e189]: Handcrafted
                  - heading "Physical Art" [level=3] [ref=e190]:
                    - link "Physical Art" [ref=e191] [cursor=pointer]:
                      - /url: /products/physical-art
                  - generic [ref=e193]:
                    - paragraph [ref=e194]: $50.00
                    - img [ref=e195]
              - generic [ref=e198]:
                - generic [ref=e199]:
                  - link "View Digital Art" [ref=e200] [cursor=pointer]:
                    - /url: /products/digital-art
                    - img "Digital Art - Handcrafted Art" [ref=e201]
                  - button "Add to wishlist" [ref=e202]:
                    - img [ref=e203]
                  - generic [ref=e205]:
                    - button "Add Digital Art to cart" [ref=e206]:
                      - img [ref=e207]
                      - text: Quick Add
                    - button "Quick View" [ref=e211]:
                      - img [ref=e212]
                - generic [ref=e215]:
                  - generic [ref=e217]:
                    - generic [ref=e218]: Art
                    - generic [ref=e220]: Handcrafted
                  - heading "Digital Art" [level=3] [ref=e221]:
                    - link "Digital Art" [ref=e222] [cursor=pointer]:
                      - /url: /products/digital-art
                  - generic [ref=e224]:
                    - paragraph [ref=e225]: $20.00
                    - img [ref=e226]
    - contentinfo [ref=e228]:
      - button "Back to top":
        - img
      - generic [ref=e230]:
        - generic [ref=e231]:
          - generic [ref=e232]:
            - generic [ref=e233]:
              - img [ref=e234]
              - img [ref=e236]
              - img [ref=e238]
              - img [ref=e240]
              - img [ref=e242]
            - paragraph [ref=e244]: 4.9/5 Rating
            - paragraph [ref=e245]: From 10,000+ Collectors
          - generic [ref=e246]:
            - img [ref=e247]
            - paragraph [ref=e249]: Fast Shipping
            - paragraph [ref=e250]: 24h Order Processing
          - generic [ref=e251]:
            - img [ref=e252]
            - paragraph [ref=e255]: Indie Artists
            - paragraph [ref=e256]: 100% Creator Supported
          - generic [ref=e257]:
            - img [ref=e258]
            - paragraph [ref=e261]: Secure Pay
            - paragraph [ref=e262]: SSL Encrypted Checkout
        - generic [ref=e263]:
          - generic [ref=e264]:
            - generic [ref=e265]:
              - link "DreamBeesArt" [ref=e266] [cursor=pointer]:
                - /url: /
                - img [ref=e268]
                - text: DreamBeesArt
              - paragraph [ref=e281]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e282] [cursor=pointer]:
              - /url: /support
              - img [ref=e283]
              - generic [ref=e286]:
                - paragraph [ref=e287]: Need help?
                - paragraph [ref=e288]: 24/7 Expert Support
              - img [ref=e289]
          - generic [ref=e291]:
            - generic [ref=e292]:
              - heading "Shop" [level=3] [ref=e293]
              - list [ref=e294]:
                - listitem [ref=e295]:
                  - link "All Products" [ref=e296] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e297]:
                  - link "Journal & Strategy" [ref=e298] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e299]:
                  - link "Artist Trading Cards" [ref=e300] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e301]:
                  - link "Art Prints" [ref=e302] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e303]:
                  - link "TCG Accessories" [ref=e304] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e305]:
              - heading "Account" [level=3] [ref=e306]
              - list [ref=e307]:
                - listitem [ref=e308]:
                  - link "Sign In" [ref=e309] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e310]:
                  - link "Order History" [ref=e311] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e312]:
                  - link "Support Center" [ref=e313] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e314]:
          - img [ref=e317]
          - generic [ref=e330]:
            - heading "Join the Hive" [level=2] [ref=e331]
            - paragraph [ref=e332]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e333]:
              - textbox "honey@hive.com" [ref=e334]
              - button "Subscribe" [ref=e335]
        - generic [ref=e336]:
          - generic [ref=e338]:
            - img [ref=e339]
            - generic [ref=e342]: US / USD
            - img [ref=e343]
          - generic [ref=e345]:
            - img [ref=e346]
            - generic [ref=e348]: Mastercard
            - generic [ref=e349]: PayPal
            - generic [ref=e350]: Stripe
            - img [ref=e351]
          - generic [ref=e354]:
            - paragraph [ref=e355]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e356]: Fan Art & Artist-Inspired Merch
  - status [ref=e357]:
    - generic [ref=e358]:
      - img [ref=e360]
      - generic [ref=e362]:
        - text: Static route
        - button "Hide static indicator" [ref=e363] [cursor=pointer]:
          - img [ref=e364]
  - alert [ref=e367]
  - generic [ref=e370]:
    - generic [ref=e371]:
      - generic [ref=e372]:
        - heading "Cart" [level=2] [ref=e373]
        - generic [ref=e375]: 0 items
      - button "Close cart" [active] [ref=e376]:
        - img [ref=e377]
    - generic [ref=e381]:
      - generic [ref=e382]:
        - img [ref=e384]
        - img [ref=e388]
      - heading "Your cart is empty" [level=3] [ref=e389]
      - paragraph [ref=e390]: Discover unique art pieces and start building your collection today.
      - button "Explore Gallery" [ref=e391]:
        - text: Explore Gallery
        - img [ref=e392]
      - generic [ref=e394]:
        - link "Paintings" [ref=e395] [cursor=pointer]:
          - /url: /collections/paintings
        - link "Digital Art" [ref=e396] [cursor=pointer]:
          - /url: /collections/digital-art
        - link "Sculptures" [ref=e397] [cursor=pointer]:
          - /url: /collections/sculptures
        - link "Limited Ed." [ref=e398] [cursor=pointer]:
          - /url: /collections/limited-ed.
```

# Test source

```ts
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
> 160 |         await plusBtn.click({ force: true });
      |                       ^ Error: locator.click: Test timeout of 60000ms exceeded.
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