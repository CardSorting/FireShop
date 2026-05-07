# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cart-checkout-comprehensive.spec.ts >> Comprehensive Cart and Checkout Flow >> should enforce quantity limits
- Location: e2e/cart-checkout-comprehensive.spec.ts:173:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('10')
Expected: visible
Error: strict mode violation: getByText('10') resolved to 6 elements:
    1) <span class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-500 px-1.5 text-[9px] font-black text-white ring-2 ring-gray-900">10</span> aka getByRole('button', { name: 'Open cart' })
    2) <p class="text-xs text-gray-500 mt-1">From 10,000+ Collectors</p> aka getByText('From 10,000+ Collectors')
    3) <p class="text-xs text-gray-500 mt-1">100% Creator Supported</p> aka getByText('% Creator Supported')
    4) <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-black text-white ring-2 ring-gray-900">10</span> aka getByText('10').nth(3)
    5) <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">10 items</span> aka getByText('10 items')
    6) <span class="w-10 text-center text-xs font-black text-gray-900">10</span> aka getByTestId('cart-item').getByText('10')

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('10')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
            - generic [ref=e71]: "10"
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
                    - button "Item added to cart" [disabled] [ref=e178]:
                      - img [ref=e179]
                      - text: Added!
                    - button "Quick View" [ref=e181]:
                      - img [ref=e182]
                - generic [ref=e185]:
                  - generic [ref=e187]:
                    - generic [ref=e188]: Art
                    - generic [ref=e190]: Handcrafted
                  - heading "Physical Art" [level=3] [ref=e191]:
                    - link "Physical Art" [ref=e192] [cursor=pointer]:
                      - /url: /products/physical-art
                  - generic [ref=e194]:
                    - paragraph [ref=e195]: $50.00
                    - img [ref=e196]
              - generic [ref=e199]:
                - generic [ref=e200]:
                  - link "View Digital Art" [ref=e201] [cursor=pointer]:
                    - /url: /products/digital-art
                    - img "Digital Art - Handcrafted Art" [ref=e202]
                  - button "Add to wishlist" [ref=e203]:
                    - img [ref=e204]
                  - generic [ref=e206]:
                    - button "Add Digital Art to cart" [ref=e207]:
                      - img [ref=e208]
                      - text: Quick Add
                    - button "Quick View" [ref=e212]:
                      - img [ref=e213]
                - generic [ref=e216]:
                  - generic [ref=e218]:
                    - generic [ref=e219]: Art
                    - generic [ref=e221]: Handcrafted
                  - heading "Digital Art" [level=3] [ref=e222]:
                    - link "Digital Art" [ref=e223] [cursor=pointer]:
                      - /url: /products/digital-art
                  - generic [ref=e225]:
                    - paragraph [ref=e226]: $20.00
                    - img [ref=e227]
    - contentinfo [ref=e229]:
      - button "Back to top":
        - img
      - generic [ref=e231]:
        - generic [ref=e232]:
          - generic [ref=e233]:
            - generic [ref=e234]:
              - img [ref=e235]
              - img [ref=e237]
              - img [ref=e239]
              - img [ref=e241]
              - img [ref=e243]
            - paragraph [ref=e245]: 4.9/5 Rating
            - paragraph [ref=e246]: From 10,000+ Collectors
          - generic [ref=e247]:
            - img [ref=e248]
            - paragraph [ref=e250]: Fast Shipping
            - paragraph [ref=e251]: 24h Order Processing
          - generic [ref=e252]:
            - img [ref=e253]
            - paragraph [ref=e256]: Indie Artists
            - paragraph [ref=e257]: 100% Creator Supported
          - generic [ref=e258]:
            - img [ref=e259]
            - paragraph [ref=e262]: Secure Pay
            - paragraph [ref=e263]: SSL Encrypted Checkout
        - generic [ref=e264]:
          - generic [ref=e265]:
            - generic [ref=e266]:
              - link "DreamBeesArt" [ref=e267] [cursor=pointer]:
                - /url: /
                - img [ref=e269]
                - text: DreamBeesArt
              - paragraph [ref=e282]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e283] [cursor=pointer]:
              - /url: /support
              - img [ref=e284]
              - generic [ref=e287]:
                - paragraph [ref=e288]: Need help?
                - paragraph [ref=e289]: 24/7 Expert Support
              - img [ref=e290]
          - generic [ref=e292]:
            - generic [ref=e293]:
              - heading "Shop" [level=3] [ref=e294]
              - list [ref=e295]:
                - listitem [ref=e296]:
                  - link "All Products" [ref=e297] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e298]:
                  - link "Journal & Strategy" [ref=e299] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e300]:
                  - link "Artist Trading Cards" [ref=e301] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e302]:
                  - link "Art Prints" [ref=e303] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e304]:
                  - link "TCG Accessories" [ref=e305] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e306]:
              - heading "Account" [level=3] [ref=e307]
              - list [ref=e308]:
                - listitem [ref=e309]:
                  - link "Sign In" [ref=e310] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e311]:
                  - link "Order History" [ref=e312] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e313]:
                  - link "Support Center" [ref=e314] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e315]:
          - img [ref=e318]
          - generic [ref=e331]:
            - heading "Join the Hive" [level=2] [ref=e332]
            - paragraph [ref=e333]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e334]:
              - textbox "honey@hive.com" [ref=e335]
              - button "Subscribe" [ref=e336]
        - generic [ref=e337]:
          - generic [ref=e339]:
            - img [ref=e340]
            - generic [ref=e343]: US / USD
            - img [ref=e344]
          - generic [ref=e346]:
            - img [ref=e347]
            - generic [ref=e349]: Mastercard
            - generic [ref=e350]: PayPal
            - generic [ref=e351]: Stripe
            - img [ref=e352]
          - generic [ref=e355]:
            - paragraph [ref=e356]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e357]: Fan Art & Artist-Inspired Merch
  - status [ref=e358]:
    - generic [ref=e359]:
      - img [ref=e361]
      - generic [ref=e363]:
        - text: Static route
        - button "Hide static indicator" [ref=e364] [cursor=pointer]:
          - img [ref=e365]
  - alert [ref=e368]
  - generic [ref=e371]:
    - generic [ref=e372]:
      - generic [ref=e373]:
        - heading "Cart" [level=2] [ref=e374]
        - generic [ref=e376]: 10 items
      - button "Close cart" [ref=e377]:
        - img [ref=e378]
    - generic [ref=e383]:
      - img [ref=e384]
      - generic [ref=e389]: Free Shipping Unlocked
    - generic [ref=e393]:
      - generic [ref=e394]:
        - img "Physical Art" [ref=e396]
        - generic [ref=e397]:
          - generic [ref=e398]:
            - generic [ref=e399]:
              - heading "Physical Art" [level=3] [ref=e400]:
                - link "Physical Art" [ref=e401] [cursor=pointer]:
                  - /url: /products/p1
              - button "Remove item" [ref=e403]:
                - img [ref=e404]
            - generic [ref=e408]: $50.00
          - generic [ref=e409]:
            - generic [ref=e410]:
              - button [ref=e411]:
                - img [ref=e412]
              - generic [ref=e413]: "10"
              - button [ref=e414]:
                - img [ref=e415]
            - paragraph [ref=e416]: $500.00
      - group [ref=e418]:
        - generic "Add a gift note or instructions" [ref=e419] [cursor=pointer]:
          - generic [ref=e420]: Add a gift note or instructions
          - img [ref=e421]
    - generic [ref=e423]:
      - generic [ref=e424]:
        - generic [ref=e425]:
          - generic [ref=e426]: Total
          - generic [ref=e427]: $500.00
        - link "Checkout" [ref=e428] [cursor=pointer]:
          - /url: /checkout
          - text: Checkout
          - img [ref=e429]
      - generic [ref=e431]:
        - generic [ref=e432]:
          - img [ref=e433]
          - img [ref=e436]
        - paragraph [ref=e440]: Secure SSL
```

# Test source

```ts
  81  |     const cards = page.locator('[data-testid="product-card"]');
  82  |     const target = cards.nth(index);
  83  |     await target.hover({ force: true });
  84  |     await target.locator('button').filter({ hasText: /Quick Add/i }).click({ force: true });
  85  |     
  86  |     await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(expectedCount, { timeout: 15000 });
  87  |     // Small delay for React state stabilization
  88  |     await page.waitForTimeout(500);
  89  |   }
  90  | 
  91  |   // --- TESTS ---
  92  | 
  93  |   test('should merge guest cart into auth session', async ({ page }) => {
  94  |     await quickAdd(page, 0, 1);
  95  |     await page.route('/api/auth/me', async (route) => {
  96  |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@example.com' }) });
  97  |     });
  98  |     await page.reload();
  99  |     await openCart(page);
  100 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  101 |   });
  102 | 
  103 |   test('should require shipping for mixed carts', async ({ page }) => {
  104 |     await quickAdd(page, 0, 1);
  105 |     await quickAdd(page, 1, 2);
  106 |     
  107 |     await page.goto('/checkout');
  108 |     await expect(page.locator('#checkout-email')).toBeVisible({ timeout: 15000 });
  109 |     await page.locator('#checkout-email').fill('mixed@example.com');
  110 |     await page.locator('#checkout-street').fill('123 Hive St');
  111 |     await page.locator('#checkout-city').fill('NY');
  112 |     await page.locator('#checkout-state').fill('NY');
  113 |     await page.locator('#checkout-zip').fill('10001');
  114 | 
  115 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  116 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
  117 |   });
  118 | 
  119 |   test('should block checkout for unsupported shipping countries', async ({ page }) => {
  120 |     await quickAdd(page, 0, 1);
  121 |     await page.goto('/checkout');
  122 |     const emailField = page.locator('#checkout-email');
  123 |     await expect(emailField).toBeVisible({ timeout: 20000 });
  124 |     await emailField.fill('test@example.com');
  125 |     await page.locator('#checkout-street').fill('123 Foreign St');
  126 |     await page.locator('#checkout-city').fill('Toronto');
  127 |     await page.locator('#checkout-state').fill('ON');
  128 |     await page.locator('#checkout-zip').fill('M5V 2L7');
  129 |     
  130 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  131 |     await expect(page.getByText(/No matching zone/i)).toBeVisible({ timeout: 15000 });
  132 |   });
  133 | 
  134 |   test('should handle payment errors', async ({ page }) => {
  135 |     await page.route('/api/auth/me', async (route) => {
  136 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'u1', email: 'test@example.com' }) });
  137 |     });
  138 |     await page.route('/api/orders', async (route) => {
  139 |         if (route.request().method() === 'POST') {
  140 |             await route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ message: 'Insufficient funds.' }) });
  141 |         }
  142 |     });
  143 | 
  144 |     await quickAdd(page, 0, 1);
  145 |     await page.goto('/checkout');
  146 |     
  147 |     // Authenticated user, email is read-only
  148 |     await expect(page.locator('#checkout-email')).toHaveValue('test@example.com');
  149 |     
  150 |     await page.locator('#checkout-street').fill('123 Test St');
  151 |     await page.locator('#checkout-city').fill('Test City');
  152 |     await page.locator('#checkout-state').fill('TS');
  153 |     await page.locator('#checkout-zip').fill('12345');
  154 |     
  155 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  156 |     await page.locator('[data-testid="continue-to-payment"]').click({ force: true });
  157 |     
  158 |     await page.locator('[data-testid="mock-checkout-button"]').click({ force: true });
  159 |     await expect(page.locator('#checkout-error')).toContainText(/Insufficient funds/i, { timeout: 20000 });
  160 |   });
  161 | 
  162 |   test('should apply discount codes', async ({ page }) => {
  163 |     await quickAdd(page, 0, 1);
  164 |     await page.goto('/checkout');
  165 |     await page.route('/api/discounts/validate', async (route) => {
  166 |         await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, discountAmount: 1000, discount: { type: 'fixed_amount', value: 1000 } }) });
  167 |     });
  168 |     await page.locator('input[placeholder="Discount code"]').fill('SAVE10');
  169 |     await page.getByRole('button', { name: /Apply/i }).click({ force: true });
  170 |     await expect(page.getByText(/SAVE10 applied/i)).toBeVisible({ timeout: 15000 });
  171 |   });
  172 | 
  173 |   test('should enforce quantity limits', async ({ page }) => {
  174 |     await quickAdd(page, 0, 1);
  175 |     const cartItem = page.locator('[data-testid="cart-item"]').first();
  176 |     const plusBtn = cartItem.locator('button:has(svg.lucide-plus)');
  177 |     for(let i = 0; i < 9; i++) {
  178 |         await plusBtn.click({ force: true });
  179 |         await page.waitForTimeout(100);
  180 |     }
> 181 |     await expect(page.getByText('10')).toBeVisible({ timeout: 15000 });
      |                                        ^ Error: expect(locator).toBeVisible() failed
  182 |     await expect(plusBtn).toBeDisabled({ timeout: 10000 });
  183 |   });
  184 | 
  185 |   test('should persist cart after reload', async ({ page }) => {
  186 |     await quickAdd(page, 0, 1);
  187 |     await page.waitForTimeout(500);
  188 |     await page.reload();
  189 |     await openCart(page);
  190 |     await expect(page.locator('[data-testid="cart-item"]')).toBeVisible({ timeout: 15000 });
  191 |   });
  192 | 
  193 | });
  194 | 
```