# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: industrialized-commerce-v10.spec.ts >> Industrialized Commerce Suite V10 >> Full Life Cycle: Physical Product Purchase
- Location: e2e/industrialized-commerce-v10.spec.ts:306:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Delivery Speed/i)
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText(/Delivery Speed/i)

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
          - link "View favorites" [ref=e65] [cursor=pointer]:
            - /url: /wishlist
            - img [ref=e66]
          - button "Open cart" [ref=e68]:
            - img [ref=e69]
            - generic [ref=e73]: Cart
            - generic [ref=e74]: "1"
          - generic [ref=e76]:
            - generic [ref=e77]:
              - generic [ref=e78]: V10 Collector
              - button "Sign Out" [ref=e79]
            - link [ref=e80] [cursor=pointer]:
              - /url: /account
              - img [ref=e81]
    - main [ref=e84]:
      - generic [ref=e86]:
        - generic [ref=e88]:
          - link "DreamBeesArt" [ref=e89] [cursor=pointer]:
            - /url: /
          - generic [ref=e90]:
            - generic [ref=e91]:
              - img [ref=e92]
              - generic [ref=e96]: AES-256 SSL Secure
            - link "Help" [ref=e97] [cursor=pointer]:
              - /url: /contact
        - generic [ref=e98]:
          - main [ref=e99]:
            - navigation "Progress" [ref=e100]:
              - list [ref=e101]:
                - listitem [ref=e102]:
                  - generic [ref=e103]:
                    - button [ref=e104]
                    - generic [ref=e107]: Information
                - listitem [ref=e109]:
                  - generic [ref=e110]:
                    - button "2" [disabled] [ref=e111]:
                      - generic [ref=e113]: "2"
                    - generic [ref=e114]: Shipping
                - listitem [ref=e116]:
                  - generic [ref=e117]:
                    - button "3" [disabled] [ref=e118]:
                      - generic [ref=e120]: "3"
                    - generic [ref=e121]: Payment
            - generic [ref=e122]:
              - generic [ref=e123]:
                - generic [ref=e124]:
                  - heading "Customer Identity" [level=1] [ref=e126]
                  - generic [ref=e127]:
                    - generic [ref=e128]:
                      - generic [ref=e129]: Email for receipt
                      - generic [ref=e130]:
                        - img [ref=e132]
                        - textbox "Email for receipt" [ref=e135]:
                          - /placeholder: you@example.com
                          - text: client@hive.art
                    - generic [ref=e136] [cursor=pointer]:
                      - checkbox "Keep me updated on new drops and collector news." [ref=e137]
                      - generic [ref=e138]: Keep me updated on new drops and collector news.
                - generic [ref=e139]:
                  - heading "Destination" [level=2] [ref=e140]
                  - generic [ref=e141]:
                    - generic [ref=e142]:
                      - generic [ref=e143]: Street Address
                      - textbox "Street Address" [ref=e145]:
                        - /placeholder: Street address, suite, or apartment
                        - text: 777 Neon Blvd
                    - generic [ref=e146]:
                      - generic [ref=e147]:
                        - generic [ref=e148]: City
                        - textbox "City" [ref=e150]: Metropolis
                      - generic [ref=e151]:
                        - generic [ref=e152]:
                          - generic [ref=e153]: State
                          - textbox "State" [ref=e155]: CA
                        - generic [ref=e156]:
                          - generic [ref=e157]: ZIP Code
                          - textbox "ZIP Code" [ref=e159]: "90210"
                - generic [ref=e160]:
                  - link "Back to cart" [ref=e161] [cursor=pointer]:
                    - /url: /cart
                    - img [ref=e162]
                    - text: Back to cart
                  - button "Continue to Shipping" [ref=e164]:
                    - generic [ref=e165]:
                      - text: Continue to Shipping
                      - img [ref=e166]
              - generic [ref=e169]:
                - generic [ref=e170]:
                  - link "Returns" [ref=e171] [cursor=pointer]:
                    - /url: /refund-policy
                  - link "Shipping" [ref=e172] [cursor=pointer]:
                    - /url: /shipping-policy
                  - link "Privacy" [ref=e173] [cursor=pointer]:
                    - /url: /privacy-policy
                  - link "Terms" [ref=e174] [cursor=pointer]:
                    - /url: /terms
                - paragraph [ref=e175]: © 2026 DreamBeesArt. Industrialized E-commerce Flow.
          - complementary [ref=e176]:
            - generic [ref=e177]:
              - generic [ref=e178]:
                - generic [ref=e179]:
                  - heading "Order Summary" [level=2] [ref=e180]
                  - generic [ref=e181]: 1 Item
                - generic [ref=e183]:
                  - generic [ref=e184]:
                    - img "Physical Masterpiece" [ref=e185]
                    - generic [ref=e186]: "1"
                  - generic [ref=e187]:
                    - paragraph [ref=e188]: Physical Masterpiece
                    - paragraph [ref=e189]: Collector Unit • $150.00
                  - paragraph [ref=e190]: $150.00
                - generic [ref=e192]:
                  - generic [ref=e193]:
                    - img
                    - textbox "Discount code" [ref=e194]
                  - button "Apply" [disabled] [ref=e195]
                - generic [ref=e196]:
                  - generic [ref=e197]:
                    - generic [ref=e198]: Subtotal
                    - generic [ref=e199]: $150.00
                  - generic [ref=e200]:
                    - generic [ref=e201]: Standard Ground
                    - generic [ref=e202]: $5.99
                  - generic [ref=e203]:
                    - generic [ref=e204]: Estimated Tax
                    - generic [ref=e205]: Calculated at next step
                  - generic [ref=e206]:
                    - generic [ref=e207]: Total Due
                    - generic [ref=e208]: USD$155.99
              - generic [ref=e210]:
                - img [ref=e212]
                - generic [ref=e215]:
                  - paragraph [ref=e216]: Free Shipping Unlocked
                  - paragraph [ref=e217]: You've reached the $100.00 collector threshold.
              - generic [ref=e218]:
                - generic [ref=e219]:
                  - img [ref=e221]
                  - generic [ref=e224]:
                    - paragraph [ref=e225]: Artist Quality
                    - paragraph [ref=e226]: All products directly support independent artists.
                - generic [ref=e227]:
                  - img [ref=e229]
                  - generic [ref=e234]:
                    - paragraph [ref=e235]: Collector-First Packing
                    - paragraph [ref=e236]: Sleeved and bubble-wrapped for maximum protection.
                - generic [ref=e237]:
                  - img [ref=e239]
                  - generic [ref=e242]:
                    - paragraph [ref=e243]: Premium Support
                    - paragraph [ref=e244]: Priority assistance for all orders over $50.
    - contentinfo [ref=e245]:
      - button "Back to top" [ref=e247]:
        - img [ref=e248]
      - generic [ref=e250]:
        - generic [ref=e251]:
          - generic [ref=e252]:
            - generic [ref=e253]:
              - img [ref=e254]
              - img [ref=e256]
              - img [ref=e258]
              - img [ref=e260]
              - img [ref=e262]
            - paragraph [ref=e264]: 4.9/5 Rating
            - paragraph [ref=e265]: From 10,000+ Collectors
          - generic [ref=e266]:
            - img [ref=e267]
            - paragraph [ref=e269]: Fast Shipping
            - paragraph [ref=e270]: 24h Order Processing
          - generic [ref=e271]:
            - img [ref=e272]
            - paragraph [ref=e275]: Indie Artists
            - paragraph [ref=e276]: 100% Creator Supported
          - generic [ref=e277]:
            - img [ref=e278]
            - paragraph [ref=e281]: Secure Pay
            - paragraph [ref=e282]: SSL Encrypted Checkout
        - generic [ref=e283]:
          - generic [ref=e284]:
            - generic [ref=e285]:
              - link "DreamBeesArt" [ref=e286] [cursor=pointer]:
                - /url: /
                - img [ref=e288]
                - text: DreamBeesArt
              - paragraph [ref=e301]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e302] [cursor=pointer]:
              - /url: /support
              - img [ref=e303]
              - generic [ref=e306]:
                - paragraph [ref=e307]: Need help?
                - paragraph [ref=e308]: 24/7 Expert Support
              - img [ref=e309]
          - generic [ref=e311]:
            - generic [ref=e312]:
              - heading "Shop" [level=3] [ref=e313]
              - list [ref=e314]:
                - listitem [ref=e315]:
                  - link "All Products" [ref=e316] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e317]:
                  - link "Journal & Strategy" [ref=e318] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e319]:
                  - link "Artist Trading Cards" [ref=e320] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e321]:
                  - link "Art Prints" [ref=e322] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e323]:
                  - link "TCG Accessories" [ref=e324] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e325]:
              - heading "Account" [level=3] [ref=e326]
              - list [ref=e327]:
                - listitem [ref=e328]:
                  - link "Sign In" [ref=e329] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e330]:
                  - link "Order History" [ref=e331] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e332]:
                  - link "Support Center" [ref=e333] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e334]:
          - img [ref=e337]
          - generic [ref=e350]:
            - heading "Join the Hive" [level=2] [ref=e351]
            - paragraph [ref=e352]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e353]:
              - textbox "honey@hive.com" [ref=e354]
              - button "Subscribe" [ref=e355]
        - generic [ref=e356]:
          - generic [ref=e358]:
            - img [ref=e359]
            - generic [ref=e362]: US / USD
            - img [ref=e363]
          - generic [ref=e365]:
            - img [ref=e366]
            - generic [ref=e368]: Mastercard
            - generic [ref=e369]: PayPal
            - generic [ref=e370]: Stripe
            - img [ref=e371]
          - generic [ref=e374]:
            - paragraph [ref=e375]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e376]: Fan Art & Artist-Inspired Merch
  - status [ref=e377]:
    - generic [ref=e378]:
      - img [ref=e380]
      - generic [ref=e382]:
        - text: Static route
        - button "Hide static indicator" [ref=e383] [cursor=pointer]:
          - img [ref=e384]
  - alert [ref=e387]: DreamBeesArt | Artist Trading Cards, Prints & TCG Accessories
```

# Test source

```ts
  250 |                 createdAt: nowIso,
  251 |               }] : undefined,
  252 |             }));
  253 | 
  254 |             await route.fulfill({ 
  255 |                 status: 200, 
  256 |                 contentType: 'application/json', 
  257 |                 body: JSON.stringify({
  258 |                   id: 'ord_123',
  259 |                   userId: 'u_v10',
  260 |                   items: orderItems,
  261 |                   total: 14099,
  262 |                   status: 'confirmed',
  263 |                   shippingAddress: { street: '777 Neon Blvd', city: 'Metropolis', state: 'CA', zip: '90210', country: 'US' },
  264 |                   paymentTransactionId: 'mock_payment_method',
  265 |                   customerName: 'V10 Collector',
  266 |                   customerEmail: 'client@hive.art',
  267 |                   trackingNumber: null,
  268 |                   shippingCarrier: null,
  269 |                   trackingUrl: null,
  270 |                   notes: [],
  271 |                   riskScore: 0,
  272 |                   shippingAmount: 599,
  273 |                   taxAmount: 0,
  274 |                   fulfillmentLocationId: null,
  275 |                   fulfillmentMethod: 'shipping',
  276 |                   fulfillments: [],
  277 |                   createdAt: nowIso,
  278 |                   updatedAt: nowIso,
  279 |                 }) 
  280 |             });
  281 |         }
  282 |     });
  283 |   }
  284 | 
  285 |   /**
  286 |    * Helper to seed cart in local storage
  287 |    */
  288 |   async function seedCart(page: Page, items: any[]) {
  289 |     const state = cartState.get(page);
  290 |     if (!state) throw new Error('Cart mocks must be initialized before seeding cart');
  291 |     state.items = items;
  292 | 
  293 |     await page.goto('/'); 
  294 |     await page.evaluate((seededItems) => {
  295 |       localStorage.setItem('DreamBees_guest_cart', JSON.stringify({
  296 |         id: 'seeded-v10',
  297 |         userId: 'guest',
  298 |         items: seededItems,
  299 |         updatedAt: new Date()
  300 |       }));
  301 |     }, items);
  302 |   }
  303 | 
  304 |   // --- COMPREHENSIVE FLOWS ---
  305 | 
  306 |   test('Full Life Cycle: Physical Product Purchase', async ({ page }) => {
  307 |     // 1. Discovery & Carting
  308 |     await page.goto('/products');
  309 |     await expect(page.locator('text=Physical Masterpiece')).toBeVisible();
  310 |     
  311 |     // Add to cart via UI
  312 |     const firstProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Physical Masterpiece' });
  313 |     await firstProduct.hover();
  314 |     await firstProduct.getByRole('button', { name: /Add Physical Masterpiece to cart/i }).click();
  315 |     
  316 |     // Verify Cart Drawer
  317 |     await expect(page.locator('h2', { hasText: /Cart/i })).toBeVisible({ timeout: 10000 });
  318 |     
  319 |     // Use a more specific locator for items in the drawer to avoid ambiguity
  320 |     const drawer = page.locator('.fixed.inset-0.z-drawer');
  321 |     await expect(drawer.locator('text=Physical Masterpiece')).toBeVisible({ timeout: 10000 });
  322 |     
  323 |     // 2. Checkout Navigation
  324 |     await page.getByRole('link', { name: /Checkout/i }).click();
  325 |     
  326 |     // Ensure drawer is completely detached (including backdrop) before proceeding
  327 |     await page.getByTestId('cart-drawer').waitFor({ state: 'detached', timeout: 15000 });
  328 |     
  329 |     await expect(page).toHaveURL(/\/checkout/);
  330 |     await expect(page.getByTestId('checkout-title')).toBeVisible({ timeout: 15000 });
  331 | 
  332 |     // 3. Information Phase
  333 |     // For authenticated users, email is read-only and already populated
  334 |     const emailField = page.locator('#checkout-email');
  335 |     await expect(emailField).toHaveValue('client@hive.art', { timeout: 15000 });
  336 |     // Stability wait for React state/mount
  337 |     await page.waitForTimeout(1000);
  338 |     
  339 |     await page.locator('#checkout-street').pressSequentially('777 Neon Blvd', { delay: 50 });
  340 |     await page.locator('#checkout-city').pressSequentially('Metropolis', { delay: 50 });
  341 |     await page.locator('#checkout-state').pressSequentially('CA', { delay: 50 });
  342 |     await page.locator('#checkout-zip').pressSequentially('90210', { delay: 50 });
  343 |     
  344 |     // Ensure state is captured
  345 |     await page.waitForTimeout(1000);
  346 |     await page.locator('[data-testid="continue-to-shipping"]').click({ force: true });
  347 | 
  348 |     // 4. Shipping Phase
  349 |     // Transition might take a moment due to calculation
> 350 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
      |                                                     ^ Error: expect(locator).toBeVisible() failed
  351 |     await expect(page.getByText(/Standard Ground/i)).toBeVisible({ timeout: 15000 });
  352 |     await page.locator('[data-testid="continue-to-payment"]').click();
  353 | 
  354 |     // 5. Payment & Review
  355 |     await expect(page.getByText(/Payment Method/i)).toBeVisible();
  356 |     
  357 |     // Apply Discount
  358 |     await page.locator('input[placeholder="Discount code"]').fill('BEE10');
  359 |     await page.getByRole('button', { name: /Apply/i }).click();
  360 |     await expect(page.getByText(/BEE10 applied/i)).toBeVisible();
  361 | 
  362 |     // Final Action
  363 |     await page.locator('[data-testid="mock-checkout-button"]').click();
  364 | 
  365 |     // 6. Success State
  366 |     await expect(page.getByText(/Thank you/i)).toBeVisible();
  367 |     await expect(page.getByText(/ORD_123/i)).toBeVisible();
  368 |   });
  369 | 
  370 |   test('Constraint Validation: Sold Out Product', async ({ page }) => {
  371 |     await page.goto('/products');
  372 |     const soldOutProduct = page.locator('[data-testid="product-card"]').filter({ hasText: 'Sold Out Artifact' });
  373 |     
  374 |     // Verify "Sold Out" UI
  375 |     await expect(soldOutProduct.getByText(/Sold Out/i).first()).toBeVisible();
  376 |     
  377 |     // Button should be disabled or absent
  378 |     const buyButton = soldOutProduct.getByRole('button', { name: /Add Sold Out Artifact to cart/i });
  379 |     if (await buyButton.isVisible()) {
  380 |         await expect(buyButton).toBeDisabled();
  381 |     }
  382 |   });
  383 | 
  384 |   test('Digital Workflow: Instant Fulfillment', async ({ page }) => {
  385 |     await seedCart(page, [
  386 |         { productId: 'p2', name: 'Digital Genesis', priceSnapshot: 2500, quantity: 1, imageUrl: '...', isDigital: true }
  387 |     ]);
  388 |     
  389 |     await page.goto('/checkout');
  390 |     // In our system, digital items might still require address for tax, or be bypassed.
  391 |     // Since we are authenticated, email is already filled.
  392 |     await expect(page.locator('#checkout-email')).toHaveValue('client@hive.art');
  393 |     
  394 |     await page.locator('[data-testid="continue-to-shipping"]').click();
  395 |     
  396 |     // In our system, digital items might still require address for tax, or be bypassed.
  397 |     // Let's assume standard flow for now but check for "Instant Digital Fulfillment" indicator
  398 |     await expect(page.getByTestId('payment-header')).toBeVisible();
  399 |     await expect(page.getByText(/Instant digital fulfillment/i)).toBeVisible();
  400 |   });
  401 | 
  402 |   test('Edge Case: Multi-Currency & Precision Formatting', async ({ page }) => {
  403 |     await seedCart(page, [
  404 |         { productId: 'p1', name: 'Physical Masterpiece', priceSnapshot: 15000, quantity: 2, imageUrl: '...', isDigital: false }
  405 |     ]);
  406 |     await page.goto('/cart');
  407 |     
  408 |     // Check formatting $300.00 - using getByTestId for deterministic targeting
  409 |     await expect(page.getByTestId('cart-total')).toHaveText('$300.00', { timeout: 10000 });
  410 |     
  411 |     // Increment quantity using the new aria-label
  412 |     const cartItem = page.locator('[data-testid="cart-item"]').filter({ hasText: 'Physical Masterpiece' });
  413 |     
  414 |     // Wait for the PATCH request to complete
  415 |     const patchPromise = page.waitForResponse(resp => 
  416 |       resp.url().includes('/api/cart/items') && resp.request().method() === 'PATCH'
  417 |     );
  418 |     await cartItem.getByTestId('increase-quantity').click();
  419 |     await patchPromise;
  420 |     
  421 |     // Stability wait for re-render
  422 |     await page.waitForTimeout(2000);
  423 |     
  424 |     // Wait for the total to update
  425 |     await expect(page.getByTestId('cart-total')).toHaveText('$450.00', { timeout: 15000 });
  426 |   });
  427 | 
  428 |   test('Search & Filter Industrial Performance', async ({ page }) => {
  429 |     await page.goto('/products');
  430 |     const searchInput = page.locator('input[placeholder*="Search"]');
  431 |     await searchInput.fill('Genesis');
  432 |     
  433 |     // Should filter to only Digital Genesis
  434 |     await expect(page.locator('text=Physical Masterpiece')).not.toBeVisible();
  435 |     await expect(page.locator('text=Digital Genesis')).toBeVisible();
  436 |     
  437 |     // Category Filter
  438 |     await searchInput.fill('');
  439 |     await page.getByLabel(/Canvas/i).check();
  440 |     await expect(page.locator('text=Digital Genesis')).not.toBeVisible();
  441 |     await expect(page.locator('text=Physical Masterpiece')).toBeVisible();
  442 |   });
  443 | 
  444 | });
  445 | 
```