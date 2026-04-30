import { test, expect } from '@playwright/test';

test.describe('Checkout Flow (Mocked)', () => {
  test('should complete checkout successfully with mocked API responses', async ({ page }) => {
    // 1. Mock Authentication
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'tester@example.com',
          displayName: 'Test User',
          role: 'customer'
        })
      });
    });

    // 2. Mock Cart
    await page.route('/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              productId: 'prod-mock-1',
              name: 'Mock Black Lotus',
              priceSnapshot: 1500000, // $15,000.00
              quantity: 1,
              imageUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400'
            }
          ]
        })
      });
    });

    // 3. Mock Products
    await page.route('/api/products*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                products: [],
                nextCursor: null
            })
        });
    });

    // 4. Mock Orders Post (Place Order)
    await page.route('/api/orders', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON();
        console.log('Intercepted order placement:', payload);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'ord-mock-789',
            status: 'confirmed',
            total: 1500000,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: [
              {
                productId: 'prod-mock-1',
                name: 'Mock Black Lotus',
                unitPrice: 1500000,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?w=400'
              }
            ],
            shippingAddress: payload.shippingAddress,
            customerEmail: 'tester@example.com',
            customerName: 'Test User'
          })
        });
      } else {
        await route.continue();
      }
    });

    // 5. Navigate to Checkout Page
    await page.goto('/checkout');

    // 6. Information Step
    await expect(page.locator('[data-testid="checkout-title"]')).toBeVisible({ timeout: 10000 });
    
    // Fill address
    await page.locator('#checkout-street').fill('123 Mock Lane');
    await page.locator('#checkout-city').fill('Mocksburg');
    await page.locator('#checkout-state').fill('MC');
    await page.locator('#checkout-zip').fill('12345');

    // Click "Continue to shipping"
    await page.locator('[data-testid="continue-to-shipping"]').click();

    // 7. Shipping Step
    await expect(page.locator('text=/Shipping method/i')).toBeVisible();
    
    // Click "Continue to payment"
    await page.locator('[data-testid="continue-to-payment"]').click();

    // 8. Payment Step
    await expect(page.locator('[data-testid="payment-header"]')).toBeVisible();
    
    // Click the Mock Checkout Button
    const mockPayBtn = page.locator('[data-testid="mock-checkout-button"]');
    await expect(mockPayBtn).toBeVisible();
    await mockPayBtn.click();

    // 9. Order Confirmation
    // Updated expectations based on OrderConfirmation.tsx
    await expect(page.locator('text=/Thank you/i')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=/Order confirmed/i')).toBeVisible();
    await expect(page.locator('text=/ORD-MOCK-789/i')).toBeVisible(); // IDs are uppercase in confirmation
    await expect(page.locator('text=/tester@example.com/i')).toBeVisible();
  });
});
