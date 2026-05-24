import { expect, test, type Locator, type Page } from '@playwright/test';

const NOTICE_SELECTOR = '.wc-block-components-notice-banner';
const PRODUCT_WITH_SKU_NAME = 'Mug';
const PRODUCT_WITHOUT_SKU_NAME = 'Notebook';

async function cartNotice(page: Page): Promise<Locator> {
    return page.locator(NOTICE_SELECTOR).filter({ hasText: 'You changed' }).first();
}

async function clearCart(page: Page) {
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');

    var removeButtons = page.locator('button[aria-label^="Remove "]');
    while (await removeButtons.count()) {
        await removeButtons.first().click();
        await page.waitForLoadState('networkidle');
        removeButtons = page.locator('button[aria-label^="Remove "]');
    }
}

async function addProductFromShop(page: Page, productName: string) {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const productCard = page.locator('li.product', { hasText: productName }).first();
    await productCard.getByRole('button').click();
    await expect(productCard.getByRole('button')).toContainText(/in cart/i);
}

async function seedCart(page: Page) {
    await clearCart(page);
    await addProductFromShop(page, PRODUCT_WITH_SKU_NAME);
    await addProductFromShop(page, PRODUCT_WITHOUT_SKU_NAME);
}

async function changeCartItemQuantity(page: Page, productName: string, newQuantity: number) {
    const input = page.getByLabel(`Quantity of ${productName} in your cart.`).first();

    await input.fill(String(newQuantity));
    await input.blur();

    await page.waitForResponse(
        (response) => response.url().includes('/cart/update-item') && response.status() === 200
    );
}

test.describe('WC Quantity Alert Plugin', () => {
    test.beforeEach(async ({ page }) => {
        await seedCart(page);
    });

    test('no alert on page load', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await expect(await cartNotice(page)).toHaveCount(0);
    });

    test('no alert on page refresh', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await page.reload();
        await page.waitForSelector('.wc-block-cart');
        await expect(await cartNotice(page)).toHaveCount(0);
    });

    test('alert on quantity change - Product with SKU', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await changeCartItemQuantity(page, PRODUCT_WITH_SKU_NAME, 5);
        const notice = await cartNotice(page);
        await expect(notice).toBeVisible();
        await expect(notice).toContainText(
            'You changed Mug (SKU: MUG001) to a quantity of 5.'
        );
    });

    test('alert on quantity change - Product without SKU', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await changeCartItemQuantity(page, PRODUCT_WITHOUT_SKU_NAME, 5);
        const notice = await cartNotice(page);
        await expect(notice).toBeVisible();
        await expect(notice).toContainText(
            'You changed Notebook to a quantity of 5.'
        );
    });

    test('no alert when quantity unchanged', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        const input = page.getByLabel(`Quantity of ${PRODUCT_WITH_SKU_NAME} in your cart.`).first();
        await input.fill('1');
        await input.blur();
        await page.waitForTimeout(1000);
        await expect(await cartNotice(page)).toHaveCount(0);
    });

    test('latest change replaces prior cart alert', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await changeCartItemQuantity(page, PRODUCT_WITH_SKU_NAME, 3);
        await changeCartItemQuantity(page, PRODUCT_WITH_SKU_NAME, 4);

        const notice = await cartNotice(page);
        await expect(notice).toBeVisible();
        await expect(notice).toContainText(
            'You changed Mug (SKU: MUG001) to a quantity of 4.'
        );
        await expect(notice).not.toContainText('quantity of 3');
    });
});