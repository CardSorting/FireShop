# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should handle complete cart lifecycle as guest
- Location: e2e/cart-checkout-comprehensive.spec.ts:98:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="cart-item"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-testid="cart-item"]')

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
              - generic [ref=e121] [cursor=pointer]:
                - checkbox "TCG" [ref=e122]
                - generic [ref=e123]: TCG
            - generic [ref=e124]:
              - heading "Condition" [level=3] [ref=e125]
              - generic [ref=e126]:
                - generic [ref=e127] [cursor=pointer]:
                  - checkbox "New" [ref=e128]
                  - generic [ref=e129]: New
                - generic [ref=e130] [cursor=pointer]:
                  - checkbox "Like New" [ref=e131]
                  - generic [ref=e132]: Like New
                - generic [ref=e133] [cursor=pointer]:
                  - checkbox "Gently Used" [ref=e134]
                  - generic [ref=e135]: Gently Used
                - generic [ref=e136] [cursor=pointer]:
                  - checkbox "Vintage" [ref=e137]
                  - generic [ref=e138]: Vintage
            - generic [ref=e139]:
              - heading "Availability" [level=3] [ref=e140]
              - generic [ref=e141]:
                - generic [ref=e142] [cursor=pointer]:
                  - checkbox "In Stock" [ref=e143]
                  - generic [ref=e144]: In Stock
                - generic [ref=e145] [cursor=pointer]:
                  - checkbox "Out of Stock" [ref=e146]
                  - generic [ref=e147]: Out of Stock
            - generic [ref=e148]:
              - heading "Price Range" [level=3] [ref=e149]
              - generic [ref=e151]:
                - generic [ref=e152]:
                  - paragraph [ref=e153]: Min
                  - spinbutton [ref=e154]: "0"
                - generic [ref=e155]:
                  - paragraph [ref=e156]: Max
                  - spinbutton [ref=e157]: "100000"
            - button "Clear All Filters" [ref=e158]
          - generic [ref=e159]:
            - paragraph [ref=e161]: Showing 1 items
            - generic [ref=e164]:
              - generic [ref=e165]:
                - link "View Black Lotus" [ref=e166] [cursor=pointer]:
                  - /url: /products/black-lotus
                  - img "Black Lotus - Handcrafted TCG" [ref=e167]
                - button "Add to wishlist" [ref=e168]:
                  - img [ref=e169]
                - generic [ref=e171]:
                  - button "Add Black Lotus to cart" [ref=e172]:
                    - img [ref=e173]
                    - text: Quick Add
                  - button "Quick View" [ref=e177]:
                    - img [ref=e178]
              - generic [ref=e181]:
                - generic [ref=e183]:
                  - generic [ref=e184]: TCG
                  - generic [ref=e186]: Handcrafted
                - heading "Black Lotus" [level=3] [ref=e187]:
                  - link "Black Lotus" [ref=e188] [cursor=pointer]:
                    - /url: /products/black-lotus
                - generic [ref=e190]:
                  - paragraph [ref=e191]: $50.00
                  - img [ref=e192]
    - contentinfo [ref=e194]:
      - button "Back to top":
        - img
      - generic [ref=e196]:
        - generic [ref=e197]:
          - generic [ref=e198]:
            - generic [ref=e199]:
              - img [ref=e200]
              - img [ref=e202]
              - img [ref=e204]
              - img [ref=e206]
              - img [ref=e208]
            - paragraph [ref=e210]: 4.9/5 Rating
            - paragraph [ref=e211]: From 10,000+ Collectors
          - generic [ref=e212]:
            - img [ref=e213]
            - paragraph [ref=e215]: Fast Shipping
            - paragraph [ref=e216]: 24h Order Processing
          - generic [ref=e217]:
            - img [ref=e218]
            - paragraph [ref=e221]: Indie Artists
            - paragraph [ref=e222]: 100% Creator Supported
          - generic [ref=e223]:
            - img [ref=e224]
            - paragraph [ref=e227]: Secure Pay
            - paragraph [ref=e228]: SSL Encrypted Checkout
        - generic [ref=e229]:
          - generic [ref=e230]:
            - generic [ref=e231]:
              - link "DreamBeesArt" [ref=e232] [cursor=pointer]:
                - /url: /
                - img [ref=e234]
                - text: DreamBeesArt
              - paragraph [ref=e247]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e248] [cursor=pointer]:
              - /url: /support
              - img [ref=e249]
              - generic [ref=e252]:
                - paragraph [ref=e253]: Need help?
                - paragraph [ref=e254]: 24/7 Expert Support
              - img [ref=e255]
          - generic [ref=e257]:
            - generic [ref=e258]:
              - heading "Shop" [level=3] [ref=e259]
              - list [ref=e260]:
                - listitem [ref=e261]:
                  - link "All Products" [ref=e262] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e263]:
                  - link "Journal & Strategy" [ref=e264] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e265]:
                  - link "Artist Trading Cards" [ref=e266] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e267]:
                  - link "Art Prints" [ref=e268] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e269]:
                  - link "TCG Accessories" [ref=e270] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e271]:
              - heading "Account" [level=3] [ref=e272]
              - list [ref=e273]:
                - listitem [ref=e274]:
                  - link "Sign In" [ref=e275] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e276]:
                  - link "Order History" [ref=e277] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e278]:
                  - link "Support Center" [ref=e279] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e280]:
          - img [ref=e283]
          - generic [ref=e296]:
            - heading "Join the Hive" [level=2] [ref=e297]
            - paragraph [ref=e298]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e299]:
              - textbox "honey@hive.com" [ref=e300]
              - button "Subscribe" [ref=e301]
        - generic [ref=e302]:
          - generic [ref=e304]:
            - img [ref=e305]
            - generic [ref=e308]: US / USD
            - img [ref=e309]
          - generic [ref=e311]:
            - img [ref=e312]
            - generic [ref=e314]: Mastercard
            - generic [ref=e315]: PayPal
            - generic [ref=e316]: Stripe
            - img [ref=e317]
          - generic [ref=e320]:
            - paragraph [ref=e321]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e322]: Fan Art & Artist-Inspired Merch
  - status [ref=e323]:
    - generic [ref=e324]:
      - img [ref=e326]
      - generic [ref=e328]:
        - text: Static route
        - button "Hide static indicator" [ref=e329] [cursor=pointer]:
          - img [ref=e330]
  - alert [ref=e333]
  - generic [ref=e336]:
    - generic [ref=e337]:
      - generic [ref=e338]:
        - heading "Cart" [level=2] [ref=e339]
        - generic [ref=e341]: 0 items
      - button "Close cart" [active] [ref=e342]:
        - img [ref=e343]
    - generic [ref=e347]:
      - generic [ref=e348]:
        - img [ref=e350]
        - img [ref=e354]
      - heading "Your cart is empty" [level=3] [ref=e355]
      - paragraph [ref=e356]: Discover unique art pieces and start building your collection today.
      - button "Explore Gallery" [ref=e357]:
        - text: Explore Gallery
        - img [ref=e358]
      - generic [ref=e360]:
        - link "Paintings" [ref=e361] [cursor=pointer]:
          - /url: /collections/paintings
        - link "Digital Art" [ref=e362] [cursor=pointer]:
          - /url: /collections/digital-art
        - link "Sculptures" [ref=e363] [cursor=pointer]:
          - /url: /collections/sculptures
        - link "Limited Ed." [ref=e364] [cursor=pointer]:
          - /url: /collections/limited-ed.
```

# Test source

```ts
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
> 123 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
      |                                                             ^ Error: expect(locator).toBeVisible() failed
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
```