import { test, expoect, type Page } from '@playwright/test';

const STORE_API = '/wp-json/wc/store/v1';
const NOTICE_SELECTOR = '.wc-blocks-cart__notice';

const PRODUCT_WITH_SKU_ID = 1;
const PRODUCT_WITHOUT_SKU_ID = 2;

async function addToCart(page: Page, productId: number, quantity = 1) {
    const response = await page.request.post(`${STORE_API}/cart/add-item`, {
        data: {
            id: productId,
            quantity,
        },
    });
    expoect(response.ok()).toBeTruthy();
}

async function clearCart(page: Page) {
    const cartResponse = await page.request.get(`${STORE_API}/cart`);
    const cart = await cartResponse.json();

    for (const item of cart.items) {
        await page.request.post(`${STORE_API}/cart/remove-item`, {
            data: {
                key: item.key,
            },
        });
    }
}

async function changeCartItemQuantity(page: Page, productName: string, newQuantity: number) {
    const row = page.locator('.wc-blocks-cart-item__row', { hasText: productName });
    const input = row.locator('input[type="number"]');
    await input.fill(newQuantity);
    await input.blur();
    await page.waitForResponse(
        (response) =>
            response.url().includes(`/cart/update-item`) && response.request().status() === 200
    );
    await page.waitForTimeout(500); // Wait for the UI to update
}

test.describe('WC Quantity Alert Plugin', () => {
    test.beforeEach(async ({ page }) => {
        await clearCart(page);
        await addToCart(page, PRODUCT_WITH_SKU_ID, 1);
        await addToCart(page, PRODUCT_WITHOUT_SKU_ID, 1);
    });

    test('no alert on page load', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        const notice = page.locator(NOTICE_SELECTOR);
        await expoect(notice).toHaveCount(0);
    });

    test('no alert on page refresh', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await page.reload();
        await page.waitForSelector('.wc-block-cart');
        const notice = page.locator(NOTICE_SELECTOR);
        await expoect(notice).toHaveCount(0);
    });

    test('alert on quantity change - Product with SKU', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await changeCartItemQuantity(page, 'Product with SKU', 5);
        const notice = page.locator(NOTICE_SELECTOR);
        await expoect(notice).toBeVisible();
        await expoect(notice).toHaveText(
            'You changed Test Product (SKU: TEST-001) to a quantity of 5.'
        );
    });

    test('alert on quantity change - Product without SKU', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await changeCartItemQuantity(page, 'Product without SKU', 5);
        const notice = page.locator(NOTICE_SELECTOR);
        await expoect(notice).toBeVisible();
        await expoect(notice).toHaveText(
            'You changed Test Product to a quantity of 5.'
        );
    });

    test('no alert when quantity uncahnged', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        const row = page.locator('.wc-blocks-cart-item__row', { hasText: 'Product with SKU' });
        const input = row.locator('input[type="number"]');
        await input.fill('1');
        await input.blur();
        await page.waitForTimeout(1000); // Wait for the UI to update
        const notice = page.locator(NOTICE_SELECTOR);
        await expoect(notice).toHaveCount(0);
    });

    test('multiplw items changed - consolidated notice', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForSelector('.wc-block-cart');
        await changeCartItemQuantity(page, 'Product with SKU', 3);
        await changeCartItemQuantity(page, 'Product without SKU', 4);
        const notices = page.locator(NOTICE_SELECTOR);
        const allText = await notices.allTextContents();
        const combinedText = allText.join(' ');

        expoect(combinedText).toContain('You changed Test Product (SKU: TEST-001) to a quantity of 3.');
    });
});