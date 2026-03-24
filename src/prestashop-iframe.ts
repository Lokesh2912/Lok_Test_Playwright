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
  return frame.locator('#js-product-list').getByRole('link', { name: new RegExp(productName, 'i') }).first();
}

export function getAddToCartButton(frame: FrameLocator): Locator {
  return frame.getByRole('button', { name: /add to cart/i });
}

export function getCartConfirmationDialog(frame: FrameLocator): Locator {
  return frame.getByRole('dialog', { name: /product successfully added to your shopping cart/i });
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

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await addToCartButton.click({
      force: attempt === 2,
      timeout: 10_000
    });

    try {
      await expect(getCartConfirmationDialog(frame)).toBeVisible({ timeout: 10_000 });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new Error('The cart confirmation dialog did not appear after clicking "Add to cart".');
}
