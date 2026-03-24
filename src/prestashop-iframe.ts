import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';

export const PRESTASHOP_DEMO_URL = 'https://demo.prestashop.com/#/en/front';
export const PRESTASHOP_IFRAME_SELECTOR = 'iframe[name="framelive"]';
export const PRESTASHOP_TIMEOUT = 30_000;

export async function openPrestaShopDemo(page: Page): Promise<void> {
  await page.goto(PRESTASHOP_DEMO_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(PRESTASHOP_IFRAME_SELECTOR)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
}

export function getPrestaShopFrame(page: Page): FrameLocator {
  return page.frameLocator(PRESTASHOP_IFRAME_SELECTOR);
}

export async function waitForStorefront(frame: FrameLocator): Promise<void> {
  await expect(getSearchInput(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await expect(frame.getByRole('link', { name: /clothes/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
}

export function getSearchInput(frame: FrameLocator): Locator {
  return frame.getByPlaceholder(/search our catalog/i);
}

export function getProductLink(frame: FrameLocator, productName: string): Locator {
  return frame.getByRole('link', { name: new RegExp(productName, 'i') }).first();
}

export function getAddToCartButton(frame: FrameLocator): Locator {
  return frame.getByRole('button', { name: /add to cart/i });
}

export function getCartConfirmationDialog(frame: FrameLocator): Locator {
  return frame.locator('.cart-content, .modal, .blockcart').filter({
  hasText: /product successfully added/i
});
}

export function getProceedToCheckoutLink(frame: FrameLocator): Locator {
  return frame.getByRole('link', { name: /proceed to checkout/i });
}

/**
 * Searches for a product using the search bar inside the demo iframe.
 */
export async function searchProduct(page: Page, productName: string): Promise<void> {
  const frame = getPrestaShopFrame(page);
  await waitForStorefront(frame);

  const searchInput = getSearchInput(frame);
  await expect(searchInput).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await searchInput.fill(productName);
  await searchInput.press('Enter');

  await expect(getProductLink(frame, productName)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
}

/**
 * Opens a product from the current listing using its visible name.
 */
export async function openProduct(page: Page, productName: string): Promise<void> {
  const frame = getPrestaShopFrame(page);
  const productLink = getProductLink(frame, productName);

  await expect(productLink).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await productLink.click();

  await expect(getAddToCartButton(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
}

/**
 * Clicks the "Add to Cart" button on a product detail page.
 */
export async function addToCart(page: Page): Promise<void> {
  const frame = getPrestaShopFrame(page);

  const addToCartButton = getAddToCartButton(frame);
  await expect(addToCartButton).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await addToCartButton.click();

  await expect(getCartConfirmationDialog(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
}
