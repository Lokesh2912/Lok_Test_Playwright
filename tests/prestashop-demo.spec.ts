import { expect, test } from '@playwright/test';
import {
  addToCart,
  getAddToCartButton,
  getCartConfirmationDialog,
  getProceedToCheckoutLink,
  getPrestaShopFrame,
  getProductLink,
  getSearchInput,
  openPrestaShopDemo,
  openProduct,
  PRESTASHOP_IFRAME_SELECTOR,
  PRESTASHOP_TIMEOUT,
  searchProduct,
  waitForStorefront,
} from '../src/prestashop-iframe';

test('loads the PrestaShop storefront inside the demo iframe', async ({ page }) => {
  await openPrestaShopDemo(page);

  const frame = getPrestaShopFrame(page);
  await waitForStorefront(frame);

  await expect(frame.getByRole('link', { name: /clothes/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
});

test('searches for a product and displays results', async ({ page }) => {
  await openPrestaShopDemo(page);

  const frame = getPrestaShopFrame(page);
  await waitForStorefront(frame);

  const productName = 'Hummingbird';
  const searchInput = getSearchInput(frame);
  await expect(searchInput).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await searchInput.fill(productName);
  await searchInput.press('Enter');

  const productLink = getProductLink(frame, productName);
  await expect(productLink).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
});

test('adds a product to the cart and verifies confirmation', async ({ page }) => {
  test.setTimeout(60_000);
  await openPrestaShopDemo(page);

  const productName = 'Hummingbird';
  await searchProduct(page, productName);
  await openProduct(page, productName);
  await addToCart(page);

  const frame = getPrestaShopFrame(page);
  const cartConfirmationDialog = getCartConfirmationDialog(frame);
  await expect(cartConfirmationDialog).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await expect(cartConfirmationDialog.getByText(/product successfully added/i)).toBeVisible({
    timeout: PRESTASHOP_TIMEOUT
  });
});

test('proceeds to checkout after adding a product to cart', async ({ page }) => {
  test.setTimeout(60_000);
  await openPrestaShopDemo(page);

  const productName = 'Hummingbird';
  await searchProduct(page, productName);
  await openProduct(page, productName);
  await addToCart(page);

  const frame = getPrestaShopFrame(page);
  const cartConfirmationDialog = getCartConfirmationDialog(frame);
  await expect(cartConfirmationDialog).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });

  const proceedToCheckoutLink = getProceedToCheckoutLink(frame);
  await expect(proceedToCheckoutLink).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await proceedToCheckoutLink.click();

  await expect(frame.getByRole('heading', { name: /shopping cart/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
});

test('loads the admin login page via back-office URL', async ({ page }) => {
  await page.goto('https://demo.prestashop.com/#/en/back', { waitUntil: 'domcontentloaded' });
  await expect(page.locator(PRESTASHOP_IFRAME_SELECTOR)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });

  const frame = getPrestaShopFrame(page);

  await expect(frame.locator('h1')).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await expect(frame.getByRole('textbox', { name: /email address/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await expect(frame.getByRole('textbox', { name: /password/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await expect(frame.getByRole('button', { name: /log in/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
});
