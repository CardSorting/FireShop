# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: industrialized-commerce-v10.spec.ts >> Industrialized Commerce Suite V10 >> Edge Case: Multi-Currency & Precision Formatting
- Location: e2e/industrialized-commerce-v10.spec.ts:402:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('cart-total')
Expected: "$450.00"
Received: "$300.00"
Timeout:  15000ms

Call log:
  - Expect "toHaveText" with timeout 15000ms
  - waiting for getByTestId('cart-total')
    19 × locator resolved to <span data-testid="cart-total" class="text-3xl font-black text-primary-600 tracking-tighter">$300.00</span>
       - unexpected value "$300.00"

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
          - link "View favorites" [ref=e63] [cursor=pointer]:
            - /url: /wishlist
            - img [ref=e64]
          - button "Open cart" [ref=e66]:
            - img [ref=e67]
            - generic [ref=e71]: Cart
            - generic [ref=e72]: "2"
          - generic [ref=e74]:
            - generic [ref=e75]:
              - generic [ref=e76]: V10 Collector
              - button "Sign Out" [ref=e77]
            - link [ref=e78] [cursor=pointer]:
              - /url: /account
              - img [ref=e79]
    - main [ref=e82]:
      - generic [ref=e85]:
        - generic [ref=e86]:
          - navigation [ref=e87]:
            - link "Home" [ref=e88] [cursor=pointer]:
              - /url: /
            - img [ref=e89]
            - generic [ref=e91]: Your Shopping Cart
          - generic [ref=e92]:
            - generic [ref=e93]:
              - heading "Shopping Cart" [level=1] [ref=e94]
              - paragraph [ref=e95]:
                - text: You have
                - generic [ref=e96]: 2 items
                - text: in your bag.
            - button "Clear All Items" [ref=e97]:
              - img [ref=e98]
              - text: Clear All Items
        - generic [ref=e101]:
          - generic [ref=e102]:
            - article [ref=e103]:
              - generic [ref=e104]:
                - link "Physical Masterpiece" [ref=e106] [cursor=pointer]:
                  - /url: /products/p1
                  - img "Physical Masterpiece" [ref=e107]
                - generic [ref=e108]:
                  - generic [ref=e109]:
                    - generic [ref=e110]:
                      - heading "Physical Masterpiece" [level=3] [ref=e111]:
                        - link "Physical Masterpiece" [ref=e112] [cursor=pointer]:
                          - /url: /products/p1
                      - generic [ref=e113]:
                        - paragraph [ref=e114]: "Unit Price: $150.00"
                        - paragraph [ref=e116]: "Total: $300.00"
                    - button [ref=e117]:
                      - img [ref=e118]
                  - generic [ref=e121]:
                    - generic [ref=e122]:
                      - button "Decrease quantity" [ref=e123]:
                        - img [ref=e124]
                      - generic [ref=e125]: "2"
                      - button "Increase quantity" [active] [ref=e126]:
                        - img [ref=e127]
                    - generic [ref=e128]:
                      - img [ref=e129]
                      - text: Securely reserved for you
            - generic [ref=e132]:
              - generic [ref=e133]:
                - img [ref=e135]
                - heading "Fast Delivery" [level=4] [ref=e140]
                - paragraph [ref=e141]: Tracked shipping on all orders
              - generic [ref=e142]:
                - img [ref=e144]
                - heading "Secure Payment" [level=4] [ref=e147]
                - paragraph [ref=e148]: 100% encrypted & secure
              - generic [ref=e149]:
                - img [ref=e151]
                - heading "Expert Support" [level=4] [ref=e158]
                - paragraph [ref=e159]: Dedicated collector assistance
          - complementary [ref=e160]:
            - generic [ref=e161]:
              - heading "Order Summary" [level=2] [ref=e162]
              - generic [ref=e163]:
                - generic [ref=e164]:
                  - paragraph [ref=e165]: Shipping Status
                  - paragraph [ref=e166]: UNLOCKED
                - paragraph [ref=e169]: Congratulations! Your order qualifies for free express shipping.
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - generic [ref=e172]: Subtotal
                  - generic [ref=e173]: $300.00
                - generic [ref=e174]:
                  - generic [ref=e175]: Shipping
                  - generic [ref=e176]: FREE
                - generic [ref=e177]:
                  - generic [ref=e178]: Estimated Tax
                  - generic [ref=e179]: $0.00
                - generic [ref=e180]:
                  - generic [ref=e181]: Total
                  - generic [ref=e182]: $300.00
              - generic [ref=e183]:
                - link "Checkout Securely" [ref=e184] [cursor=pointer]:
                  - /url: /checkout
                  - text: Checkout Securely
                  - img [ref=e185]
                - button "Have a promo code?" [ref=e189]
              - generic [ref=e190]:
                - generic [ref=e191]:
                  - img [ref=e192]
                  - img [ref=e194]
                  - img [ref=e196]
                - paragraph [ref=e198]: Trusted by 50,000+ Collectors
            - link "Continue Shopping" [ref=e199] [cursor=pointer]:
              - /url: /products
              - img [ref=e200]
              - text: Continue Shopping
    - contentinfo [ref=e202]:
      - button "Back to top":
        - img
      - generic [ref=e204]:
        - generic [ref=e205]:
          - generic [ref=e206]:
            - generic [ref=e207]:
              - img [ref=e208]
              - img [ref=e210]
              - img [ref=e212]
              - img [ref=e214]
              - img [ref=e216]
            - paragraph [ref=e218]: 4.9/5 Rating
            - paragraph [ref=e219]: From 10,000+ Collectors
          - generic [ref=e220]:
            - img [ref=e221]
            - paragraph [ref=e223]: Fast Shipping
            - paragraph [ref=e224]: 24h Order Processing
          - generic [ref=e225]:
            - img [ref=e226]
            - paragraph [ref=e229]: Indie Artists
            - paragraph [ref=e230]: 100% Creator Supported
          - generic [ref=e231]:
            - img [ref=e232]
            - paragraph [ref=e235]: Secure Pay
            - paragraph [ref=e236]: SSL Encrypted Checkout
        - generic [ref=e237]:
          - generic [ref=e238]:
            - generic [ref=e239]:
              - link "DreamBeesArt" [ref=e240] [cursor=pointer]:
                - /url: /
                - img [ref=e242]
                - text: DreamBeesArt
              - paragraph [ref=e255]: Founded by artists, for art lovers. We're building the go-to marketplace for fan art and artist-inspired merch — trading cards, prints, and TCG accessories from independent creators.
            - link "Need help? 24/7 Expert Support" [ref=e256] [cursor=pointer]:
              - /url: /support
              - img [ref=e257]
              - generic [ref=e260]:
                - paragraph [ref=e261]: Need help?
                - paragraph [ref=e262]: 24/7 Expert Support
              - img [ref=e263]
          - generic [ref=e265]:
            - generic [ref=e266]:
              - heading "Shop" [level=3] [ref=e267]
              - list [ref=e268]:
                - listitem [ref=e269]:
                  - link "All Products" [ref=e270] [cursor=pointer]:
                    - /url: /products
                - listitem [ref=e271]:
                  - link "Journal & Strategy" [ref=e272] [cursor=pointer]:
                    - /url: /blog
                - listitem [ref=e273]:
                  - link "Artist Trading Cards" [ref=e274] [cursor=pointer]:
                    - /url: /collections/artist-cards
                - listitem [ref=e275]:
                  - link "Art Prints" [ref=e276] [cursor=pointer]:
                    - /url: /collections/prints
                - listitem [ref=e277]:
                  - link "TCG Accessories" [ref=e278] [cursor=pointer]:
                    - /url: /collections/accessories
            - generic [ref=e279]:
              - heading "Account" [level=3] [ref=e280]
              - list [ref=e281]:
                - listitem [ref=e282]:
                  - link "Sign In" [ref=e283] [cursor=pointer]:
                    - /url: /login
                - listitem [ref=e284]:
                  - link "Order History" [ref=e285] [cursor=pointer]:
                    - /url: /orders
                - listitem [ref=e286]:
                  - link "Support Center" [ref=e287] [cursor=pointer]:
                    - /url: /support
        - generic [ref=e288]:
          - img [ref=e291]
          - generic [ref=e304]:
            - heading "Join the Hive" [level=2] [ref=e305]
            - paragraph [ref=e306]: Get the latest artist drops, limited editions, and sweet deals delivered straight to your inbox.
            - generic [ref=e307]:
              - textbox "honey@hive.com" [ref=e308]
              - button "Subscribe" [ref=e309]
        - generic [ref=e310]:
          - generic [ref=e312]:
            - img [ref=e313]
            - generic [ref=e316]: US / USD
            - img [ref=e317]
          - generic [ref=e319]:
            - img [ref=e320]
            - generic [ref=e322]: Mastercard
            - generic [ref=e323]: PayPal
            - generic [ref=e324]: Stripe
            - img [ref=e325]
          - generic [ref=e328]:
            - paragraph [ref=e329]: © 2026 DreamBeesArt. All Rights Reserved.
            - paragraph [ref=e330]: Fan Art & Artist-Inspired Merch
  - generic:
    - generic [ref=e333] [cursor=pointer]:
      - img [ref=e334]
      - generic [ref=e336]: 3 errors
      - button "Hide Errors" [ref=e337]:
        - img [ref=e338]
    - status [ref=e341]:
      - generic [ref=e342]:
        - img [ref=e344]
        - generic [ref=e346]:
          - text: Static route
          - button "Hide static indicator" [ref=e347] [cursor=pointer]:
            - img [ref=e348]
  - alert [ref=e351]
```

# Test source

```ts
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
  350 |     await expect(page.getByText(/Delivery Speed/i)).toBeVisible({ timeout: 15000 });
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
> 425 |     await expect(page.getByTestId('cart-total')).toHaveText('$450.00', { timeout: 15000 });
      |                                                  ^ Error: expect(locator).toHaveText(expected) failed
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