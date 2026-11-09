
import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test('Customer can register and complete an order', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  const email = `playwright-${Date.now()}@example.com`;

  console.log('STEP 1: Register');
  await page.goto('/register');

  await page.getByPlaceholder('Email').fill(email);
  await page.locator('input[type="password"]').fill('Test123456');
  await page.locator('form button').click();

  await expect(page).toHaveURL(/\/cart/);

  console.log('STEP 2: Open product');
  await page.goto('/');

  const firstProduct = page.locator('a[href^="/products/"]').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await expect(page.locator('main img').first()).toBeVisible();

  console.log('STEP 3: Add to cart');
  const addButton = page.locator('main button').last();

  await expect(addButton).toBeVisible();
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expect(page).toHaveURL(/\/cart/, { timeout: 15000 });

  console.log('STEP 4: Checkout');
  const checkoutButton = page.locator('main button').last();

  await expect(checkoutButton).toBeVisible();
  await expect(checkoutButton).toBeEnabled();
  await checkoutButton.click();

  await expect(page).toHaveURL(/\/checkout/, { timeout: 15000 });

  console.log('STEP 5: Payment');
  const paymentButton = page.locator('main button').last();

  await expect(paymentButton).toBeVisible();
  await expect(paymentButton).toBeEnabled();
  await paymentButton.click();

  console.log('STEP 6: Verify order');
  await expect(page).toHaveURL(/\/confirmation\//, {
    timeout: 30000,
  });

  await expect(page.getByText('Đặt hàng thành công')).toBeVisible();
  await expect(page.getByText(/PAID/)).toBeVisible();
});
