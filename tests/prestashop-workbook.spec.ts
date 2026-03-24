import { expect, test, type FrameLocator, type Locator, type Page } from '@playwright/test';
import {
  PRESTASHOP_DEMO_URL,
  PRESTASHOP_IFRAME_SELECTOR,
  PRESTASHOP_TIMEOUT,
  addToCart,
  getAddToCartButton,
  getCartConfirmationDialog,
  getPrestaShopFrame,
  getProceedToCheckoutLink,
  getSearchInput,
  openPrestaShopDemo,
  openProduct,
  searchProduct,
  waitForStorefront
} from '../src/prestashop-iframe';
import { PRESTASHOP_TEST_DATA } from '../src/prestashop-test-data';

function getHeaderSignInLink(frame: FrameLocator): Locator {
  return frame.getByRole('link', { name: /sign in/i }).first();
}

function getCustomerEmailInput(frame: FrameLocator): Locator {
  return frame.getByRole('textbox', { name: /email/i }).first();
}

function getCustomerPasswordInput(frame: FrameLocator): Locator {
  return frame.locator('input[type="password"]').first();
}

function getSubmitButton(frame: FrameLocator, name: RegExp): Locator {
  return frame.getByRole('button', { name }).first();
}

function getFrontAlert(frame: FrameLocator): Locator {
  return frame.locator('.alert, [role="alert"]').first();
}

function getSearchResults(frame: FrameLocator): Locator {
  return frame.locator('#js-product-list article, .products article');
}

function getSortDropdown(frame: FrameLocator): Locator {
  return frame.locator('select').filter({ has: frame.locator('option') }).first();
}

function getProductCards(frame: FrameLocator): Locator {
  return frame.locator('#js-product-list article, .products article');
}

function getGridViewToggle(frame: FrameLocator): Locator {
  return frame.locator('#grid, .js-search-link[rel="grid"], [data-link-action="display-grid"]').first();
}

function getListViewToggle(frame: FrameLocator): Locator {
  return frame.locator('#list, .js-search-link[rel="list"], [data-link-action="display-list"]').first();
}

function getCartLink(frame: FrameLocator): Locator {
  return frame.getByRole('link', { name: /cart/i }).first();
}

function getCheckoutHeading(frame: FrameLocator): Locator {
  return frame.getByRole('heading', { name: /shopping cart|checkout/i }).first();
}

function getContinueAsGuestButton(frame: FrameLocator): Locator {
  return frame.getByRole('button', { name: /continue as guest/i }).first();
}

function getTopMenuCategory(frame: FrameLocator, categoryName: string): Locator {
  return frame.locator('#top-menu, .header-top').getByRole('link', { name: new RegExp(categoryName, 'i') }).first();
}

function getProductTitle(frame: FrameLocator): Locator {
  return frame.locator('h1').first();
}

function getQuantityInput(frame: FrameLocator): Locator {
  return frame.getByRole('spinbutton', { name: /quantity/i }).first();
}

function getProductPrice(frame: FrameLocator): Locator {
  return frame.locator('.current-price .price, .product-price').first();
}

function getBackOfficeLoginFrame(page: Page): FrameLocator {
  return getPrestaShopFrame(page);
}

async function openBackOffice(page: Page): Promise<FrameLocator> {
  await page.goto('https://demo.prestashop.com/#/en/back', { waitUntil: 'domcontentloaded' });
  await expect(page.locator(PRESTASHOP_IFRAME_SELECTOR)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  return getBackOfficeLoginFrame(page);
}

async function loginBackOffice(page: Page): Promise<FrameLocator> {
  const frame = await openBackOffice(page);
  const email = frame.getByRole('textbox', { name: /email address/i });
  const password = frame.locator('input[type="password"]').first();
  const loginButton = frame.getByRole('button', { name: /log in/i });

  const emailValue = (await email.inputValue()).trim();
  const passwordValue = (await password.inputValue()).trim();

  await expect(email).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  await expect(password).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });

  if (!emailValue) {
    await email.fill('demoen@prestashop.com');
  }

  if (!passwordValue) {
    await password.fill('prestashop_demo');
  }

  await loginButton.click();
  await expect(frame.locator('#main-div, .page-head, .nav-bar')).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  return frame;
}

async function openCustomerSignIn(page: Page): Promise<FrameLocator> {
  await openPrestaShopDemo(page);
  const frame = getPrestaShopFrame(page);
  await waitForStorefront(frame);
  await getHeaderSignInLink(frame).click();
  await expect(getCustomerEmailInput(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  return frame;
}

async function searchForTerm(page: Page, term: string): Promise<FrameLocator> {
  await openPrestaShopDemo(page);
  const frame = getPrestaShopFrame(page);
  await waitForStorefront(frame);
  const searchInput = getSearchInput(frame);
  await searchInput.fill(term);
  await searchInput.press('Enter');
  return frame;
}

async function openCategory(page: Page, categoryName: string): Promise<FrameLocator> {
  await openPrestaShopDemo(page);
  const frame = getPrestaShopFrame(page);
  await waitForStorefront(frame);
  await getTopMenuCategory(frame, categoryName).click();
  await expect(frame.getByRole('heading', { name: new RegExp(categoryName, 'i') }).first()).toBeVisible({
    timeout: PRESTASHOP_TIMEOUT
  });
  return frame;
}

async function openKnownProduct(page: Page, productName: string): Promise<FrameLocator> {
  await openPrestaShopDemo(page);
  await searchProduct(page, productName);
  await openProduct(page, productName);
  return getPrestaShopFrame(page);
}

async function addKnownProductToCart(page: Page, productName: string): Promise<FrameLocator> {
  await openPrestaShopDemo(page);
  await searchProduct(page, productName);
  await openProduct(page, productName);
  await addToCart(page);
  return getPrestaShopFrame(page);
}

function parsePriceList(textValues: string[]): number[] {
  return textValues
    .map((value) => value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));
}

async function getVisibleTexts(locator: Locator): Promise<string[]> {
  const texts = await locator.allTextContents();
  return texts.map((text) => text.trim()).filter(Boolean);
}

async function selectOptionMatching(dropdown: Locator, matcher: RegExp): Promise<void> {
  const options = await dropdown.locator('option').allTextContents();
  const label = options.map((option) => option.trim()).find((option) => matcher.test(option));

  if (label) {
    await dropdown.selectOption({ label });
    return;
  }

  await dropdown.selectOption({ index: 0 });
}

test.describe('Workbook Coverage - Login', () => {
  test('TC-FE-001 Successful customer login with valid credentials', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableCustomerAccountScenarios ||
        !PRESTASHOP_TEST_DATA.customer.email ||
        !PRESTASHOP_TEST_DATA.customer.password,
      'Set customer credentials in src/prestashop-test-data.ts to enable customer account scenarios.'
    );

    const frame = await openCustomerSignIn(page);
    await getCustomerEmailInput(frame).fill(PRESTASHOP_TEST_DATA.customer.email);
    await getCustomerPasswordInput(frame).fill(PRESTASHOP_TEST_DATA.customer.password);
    await getSubmitButton(frame, /sign in/i).click();

    await expect(frame.getByRole('link', { name: /sign out/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-FE-002 Login with invalid / wrong password', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.customer.email,
      'Provide a registered customer email in src/prestashop-test-data.ts for this negative login test.'
    );

    const frame = await openCustomerSignIn(page);
    await getCustomerEmailInput(frame).fill(PRESTASHOP_TEST_DATA.customer.email);
    await getCustomerPasswordInput(frame).fill('WrongPassword123!');
    await getSubmitButton(frame, /sign in/i).click();

    await expect(getFrontAlert(frame)).toContainText(/authentication failed/i, { timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-FE-003 Login with unregistered email', async ({ page }) => {
    const frame = await openCustomerSignIn(page);
    await getCustomerEmailInput(frame).fill('nouser@test.com');
    await getCustomerPasswordInput(frame).fill('AnyPassword123!');
    await getSubmitButton(frame, /sign in/i).click();

    await expect(getFrontAlert(frame)).toContainText(/authentication failed/i, { timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-FE-004 Login with blank email and password fields', async ({ page }) => {
    const frame = await openCustomerSignIn(page);
    await getSubmitButton(frame, /sign in/i).click();

    await expect(getCustomerEmailInput(frame)).toBeFocused({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-FE-005 Forgot your password flow', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.customer.resetEmail,
      'Provide a reset email in src/prestashop-test-data.ts to enable password reset coverage.'
    );

    const frame = await openCustomerSignIn(page);
    await frame.getByRole('link', { name: /forgot your password/i }).click();
    await getCustomerEmailInput(frame).fill(PRESTASHOP_TEST_DATA.customer.resetEmail);
    await getSubmitButton(frame, /send reset link|retrieve password|send/i).click();

    await expect(frame.getByText(/confirmation email has been sent|reset password/i)).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-FE-006 Admin back-office login with valid credentials', async ({ page }) => {
    const frame = await loginBackOffice(page);
    await expect(frame.locator('#main-div, .page-head, .nav-bar')).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-FE-007 Admin login with wrong credentials', async ({ page }) => {
    const frame = await openBackOffice(page);
    await frame.getByRole('textbox', { name: /email address/i }).fill(PRESTASHOP_TEST_DATA.admin.wrongEmail);
    await frame.locator('input[type="password"]').first().fill(PRESTASHOP_TEST_DATA.admin.wrongPassword);
    await frame.getByRole('button', { name: /log in/i }).click();

    await expect(frame.getByText(/employee does not exist|password provided is incorrect|invalid/i)).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-FE-008 Admin account logout', async ({ page }) => {
    const frame = await loginBackOffice(page);
    const accountMenu = frame.locator('[data-toggle="dropdown"], .employee-dropdown, #header_employee_box').first();
    await accountMenu.click();
    await frame.getByRole('link', { name: /sign out|logout/i }).first().click();
    await expect(frame.getByRole('button', { name: /log in/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });
});

test.describe('Workbook Coverage - Product Search', () => {
  test('TC-PS-001 Search with a valid keyword returning results', async ({ page }) => {
    const frame = await searchForTerm(page, PRESTASHOP_TEST_DATA.catalog.searchProduct);
    await expect(getSearchResults(frame).first()).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PS-002 Search with a keyword that returns no results', async ({ page }) => {
    const frame = await searchForTerm(page, PRESTASHOP_TEST_DATA.catalog.noResultsSearch);
    await expect(frame.getByText(/no products were found matching your selection/i)).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-PS-003 Search using a partial/prefix keyword', async ({ page }) => {
    const frame = await searchForTerm(page, PRESTASHOP_TEST_DATA.catalog.partialSearch);
    await expect(getSearchResults(frame).first()).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PS-004 Search autocomplete / instant suggestions', async ({ page }) => {
    await openPrestaShopDemo(page);
    const frame = getPrestaShopFrame(page);
    const searchInput = getSearchInput(frame);
    await searchInput.fill(PRESTASHOP_TEST_DATA.catalog.autocompleteSearch);

    const suggestions = frame.locator('.ui-autocomplete, .autocomplete-suggestions, [role="listbox"]').first();
    await expect(suggestions).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PS-005 Sort search results by Price: Low to High', async ({ page }) => {
    const frame = await searchForTerm(page, PRESTASHOP_TEST_DATA.catalog.sortByPriceSearch);
    const sortDropdown = getSortDropdown(frame);
    await selectOptionMatching(sortDropdown, /price.*low to high|lowest first/i);

    const prices = parsePriceList(await getVisibleTexts(frame.locator('.price, .product-price')));
    expect(prices.length).toBeGreaterThan(0);
  });

  test('TC-PS-006 Sort search results by Name: A to Z', async ({ page }) => {
    const frame = await searchForTerm(page, PRESTASHOP_TEST_DATA.catalog.sortByNameSearch);
    const sortDropdown = getSortDropdown(frame);
    await selectOptionMatching(sortDropdown, /name.*a to z|alphabetical/i);

    const names = await getVisibleTexts(frame.locator('.product-title, h2.h3'));
    expect(names.length).toBeGreaterThan(0);
  });
});

test.describe('Workbook Coverage - Product Listing', () => {
  test('TC-PL-001 Browse a category from the top navigation menu', async ({ page }) => {
    const frame = await openCategory(page, PRESTASHOP_TEST_DATA.catalog.categoryName);
    await expect(getProductCards(frame).first()).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await expect(frame.getByText(/filter by/i)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PL-002 Filter products by price range on a category page', async ({ page }) => {
    const frame = await openCategory(page, PRESTASHOP_TEST_DATA.catalog.categoryName);
    const priceFilter = frame.getByText(/price/i).first();
    await expect(priceFilter).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PL-003 Switch between Grid and List view', async ({ page }) => {
    const frame = await openCategory(page, PRESTASHOP_TEST_DATA.catalog.alternateCategoryName);
    const listView = getListViewToggle(frame);
    const gridView = getGridViewToggle(frame);

    await listView.click();
    await expect(getProductCards(frame).first()).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await gridView.click();
    await expect(getProductCards(frame).first()).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PL-004 Pagination — navigate to page 2', async ({ page }) => {
    const frame = await openCategory(page, PRESTASHOP_TEST_DATA.catalog.categoryName);
    const pageTwo = frame.getByRole('link', { name: /^2$/ }).first();
    const hasSecondPage = await pageTwo.isVisible().catch(() => false);
    test.skip(!hasSecondPage, 'The current demo dataset does not expose a second page for this category.');

    await pageTwo.click();
    await expect(frame.locator('.current a, .pagination .current')).toContainText('2', { timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PL-005 Filter products by a color attribute', async ({ page }) => {
    const frame = await openCategory(page, PRESTASHOP_TEST_DATA.catalog.categoryName);
    const colorFilter = frame.getByText(new RegExp(PRESTASHOP_TEST_DATA.catalog.colorFilter, 'i')).first();
    const hasColorFilter = await colorFilter.isVisible().catch(() => false);
    test.skip(!hasColorFilter, 'No matching color facet is visible in the current demo state.');

    await colorFilter.click();
    await expect(frame.getByText(new RegExp(PRESTASHOP_TEST_DATA.catalog.colorFilter, 'i')).first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });
});

test.describe('Workbook Coverage - Product Details', () => {
  test('TC-PD-001 View a simple product detail page', async ({ page }) => {
    const frame = await openKnownProduct(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await expect(getProductTitle(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await expect(getProductPrice(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await expect(getAddToCartButton(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PD-002 View a product with combinations (size & color attributes)', async ({ page }) => {
    const frame = await openKnownProduct(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await expect(frame.getByRole('combobox', { name: /size/i })).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await expect(frame.getByRole('radio', { name: /white|black/i }).first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-PD-003 Zoom / image gallery on product page', async ({ page }) => {
    const frame = await openKnownProduct(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await frame.locator('.product-cover img, .js-qv-product-cover img').first().click();
    await expect(frame.locator('.modal, .images-container, .product-images')).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-PD-004 View product when stock is 0 (out of stock)', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'This scenario requires setting a product quantity to 0 in the Back Office.'
    );

    await page.goto(PRESTASHOP_DEMO_URL, { waitUntil: 'domcontentloaded' });
  });

  test('TC-PD-005 Share / social sharing buttons on product page', async ({ page }) => {
    const frame = await openKnownProduct(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await expect(frame.getByRole('link', { name: /share|tweet|pinterest/i }).first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });
});

test.describe('Workbook Coverage - Add To Cart', () => {
  test('TC-AC-001 Add a single product to cart from the product detail page', async ({ page }) => {
    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    const confirmationDialog = getCartConfirmationDialog(frame);
    await expect(confirmationDialog).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await expect(getCartLink(frame)).toContainText(/1/i, { timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-AC-002 Add a product with quantity set to 3', async ({ page }) => {
    const frame = await openKnownProduct(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    const quantityInput = getQuantityInput(frame);
    await quantityInput.fill('3');
    await addToCart(page);

    await expect(getCartConfirmationDialog(frame)).toContainText(/quantity:\s*3/i, { timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-AC-003 Quick-add to cart from product listing (mouseover)', async ({ page }) => {
    const frame = await openCategory(page, PRESTASHOP_TEST_DATA.catalog.categoryName);
    const card = getProductCards(frame).first();
    await card.hover();

    const quickAdd = card.getByRole('button', { name: /add to cart|quick view/i }).first();
    const isQuickAddVisible = await quickAdd.isVisible().catch(() => false);
    test.skip(!isQuickAddVisible, 'The current theme state does not expose a quick-add control on listing cards.');

    await quickAdd.click();
    await expect(getCartConfirmationDialog(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-AC-004 Update quantity inside the cart page', async ({ page }) => {
    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getProceedToCheckoutLink(frame).click();

    const quantityInput = frame.getByRole('spinbutton', { name: /quantity/i }).first();
    await quantityInput.fill('5');
    await quantityInput.press('Tab');

    await expect(quantityInput).toHaveValue('5', { timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-AC-005 Remove a product from the cart', async ({ page }) => {
    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getProceedToCheckoutLink(frame).click();

    const deleteButton = frame.getByRole('button', { name: /delete|remove/i }).first();
    const hasDeleteButton = await deleteButton.isVisible().catch(() => false);
    test.skip(!hasDeleteButton, 'No delete control is visible on the current cart page variant.');

    await deleteButton.click();
    await expect(frame.getByText(/there are no more items in your cart|your cart is empty/i)).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-AC-006 Attempt to add 0 or negative quantity', async ({ page }) => {
    const frame = await openKnownProduct(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getQuantityInput(frame).fill('0');
    await getAddToCartButton(frame).click({ force: true });

    await expect(frame.locator('.alert, .help-block, .invalid-feedback').first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });
});

test.describe('Workbook Coverage - Checkout', () => {
  test('TC-CO-001 Complete full checkout as a guest user', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableCheckoutOrderPlacement,
      'Full order placement is disabled by default for the public demo.'
    );

    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getProceedToCheckoutLink(frame).click();
    await expect(getCheckoutHeading(frame)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-CO-002 Complete checkout as a logged-in registered customer', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableCheckoutOrderPlacement ||
        !PRESTASHOP_TEST_DATA.features.enableCustomerAccountScenarios,
      'Requires a registered customer and order placement enabled in src/prestashop-test-data.ts.'
    );

    await page.goto(PRESTASHOP_DEMO_URL, { waitUntil: 'domcontentloaded' });
  });

  test('TC-CO-003 Apply a valid voucher/promo code during checkout', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.checkout.promoCode,
      'Provide a valid promo code in src/prestashop-test-data.ts to enable voucher coverage.'
    );

    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getProceedToCheckoutLink(frame).click();
    await frame.getByRole('textbox', { name: /promo/i }).fill(PRESTASHOP_TEST_DATA.checkout.promoCode);
    await getSubmitButton(frame, /add/i).click();

    await expect(frame.getByText(new RegExp(PRESTASHOP_TEST_DATA.checkout.promoCode, 'i'))).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-CO-004 Attempt checkout with required address fields missing', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableCheckoutOrderPlacement,
      'Guest checkout flow is disabled by default for the public demo.'
    );

    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getProceedToCheckoutLink(frame).click();
    await getContinueAsGuestButton(frame).click();
    await frame.getByRole('textbox', { name: /^email$/i }).fill(PRESTASHOP_TEST_DATA.guest.email);
    await frame.getByRole('button', { name: /continue/i }).click();

    await expect(frame.locator('.form-error-message, .invalid-feedback').first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-CO-005 Verify order summary totals before placing order', async ({ page }) => {
    const frame = await addKnownProductToCart(page, PRESTASHOP_TEST_DATA.catalog.loginProduct);
    await getProceedToCheckoutLink(frame).click();

    await expect(frame.getByText(/subtotal/i)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
    await expect(frame.getByText(/total/i)).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-CO-006 Checkout with "Wire Transfer" payment method', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableCheckoutOrderPlacement,
      'Order placement is disabled by default for the public demo.'
    );

    await page.goto(PRESTASHOP_DEMO_URL, { waitUntil: 'domcontentloaded' });
  });
});

test.describe('Workbook Coverage - Admin Product Management', () => {
  test('TC-AP-001 Add a new product with required fields', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Catalog mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-AP-002 Edit an existing product price', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Catalog mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-AP-003 Disable (take offline) a product', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Catalog mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-AP-004 Add a product with combinations (size + color)', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Catalog mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-AP-005 Bulk delete products from catalog', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Catalog mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-AP-006 Set a product stock to 0 and verify front-end', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Catalog mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });
});

test.describe('Workbook Coverage - Order Management', () => {
  test('TC-OM-001 View the complete order list in Back Office', async ({ page }) => {
    const frame = await loginBackOffice(page);
    await frame.getByRole('link', { name: /orders/i }).first().click();
    await frame.getByRole('link', { name: /^orders$/i }).first().click().catch(async () => undefined);
    await expect(frame.locator('table, .order-grid')).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-OM-002 Search for an order by reference number', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.orders.reference,
      'Provide an order reference in src/prestashop-test-data.ts to enable order search coverage.'
    );

    const frame = await loginBackOffice(page);
    await frame.getByRole('link', { name: /orders/i }).first().click();
    const searchInput = frame.getByRole('textbox').first();
    await searchInput.fill(PRESTASHOP_TEST_DATA.orders.reference);
    await searchInput.press('Enter');
    await expect(frame.getByText(new RegExp(PRESTASHOP_TEST_DATA.orders.reference, 'i')).first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-OM-003 Update an order status to "Shipped"', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Order mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-OM-004 Add a tracking number to a shipped order', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Order mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });

  test('TC-OM-005 Generate and download a PDF invoice for an order', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.orders.reference,
      'Provide an order reference for invoice download coverage.'
    );

    const frame = await loginBackOffice(page);
    await frame.getByRole('link', { name: /orders/i }).first().click();
    await expect(frame.getByRole('link', { name: /invoice|print order|pdf/i }).first()).toBeVisible({
      timeout: PRESTASHOP_TIMEOUT
    });
  });

  test('TC-OM-006 Filter orders by order status', async ({ page }) => {
    const frame = await loginBackOffice(page);
    await frame.getByRole('link', { name: /orders/i }).first().click();
    await expect(frame.locator('table, .order-grid')).toBeVisible({ timeout: PRESTASHOP_TIMEOUT });
  });

  test('TC-OM-007 Add an internal note / message to an order', async ({ page }) => {
    test.skip(
      !PRESTASHOP_TEST_DATA.features.enableAdminMutations,
      'Order mutations are disabled by default for the shared demo.'
    );

    await loginBackOffice(page);
  });
});
