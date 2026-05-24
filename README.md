# WC Quantity Alert

A WooCommerce plugin that displays a dismissible success notice in the Block Cart whenever a shopper updates an item's quantity. The notice includes the product name and, when available, the SKU — giving shoppers clear confirmation of what they just changed.

## How It Works

1. **Server-side tracking** — `WC_Quantity_Tracker` hooks into `woocommerce_after_cart_item_quantity_update` to record each quantity change (product name, SKU, new quantity) in the WooCommerce session.
2. **Store API extension** — The plugin extends the Cart Store API endpoint to expose those session-stored changes under the `wc-quantity-alert` namespace.
3. **Client-side notice** — A vanilla JS subscriber (`quantity-alert.js`) watches the `wc/store/cart` data store via `wp.data`. When new changes appear in `cartData.extensions['wc-quantity-alert']`, it dispatches a `core/notices` success notice into the `wc/cart` context.

Notices are deduplicated (the same change is never shown twice) and cleared from the session after being read.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Required by `@wordpress/env` |
| npm | 9+ | |
| Docker Desktop | latest | `@wordpress/env` uses Docker to run WordPress |
| WP-CLI | latest | Used by the setup scripts inside the Docker container |

---

## Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Start the WordPress + WooCommerce environment
npx wp-env start

# 3. Run the storefront setup (theme, pages, navigation, settings)
npx wp-env run cli bash wp-content/scripts/setup-storefront.sh

# 4. Seed demo products (3 with SKU, 2 without)
npx wp-env run cli bash wp-content/scripts/seed-products.sh
```

---

## Access Links

| Page | URL |
|------|-----|
| Home | http://localhost:8888/ |
| Shop | http://localhost:8888/shop/ |
| Cart | http://localhost:8888/cart/ |
| Admin | http://localhost:8888/wp-admin/ |

**Admin credentials:** `admin` / `password`

---

## Demo Walkthrough

1. Open the **Shop** page at http://localhost:8888/shop/.
2. Add any product to the cart (click *Add to cart*).
3. Navigate to the **Cart** page at http://localhost:8888/cart/.
4. Change a product's quantity using the quantity input field — increase or decrease it.
5. Click outside the input or press Tab to trigger the update.
6. A green success notice appears at the top of the cart:
   - **With SKU:** `You changed T-Shirt (SKU: TSHIRT001) to a quantity of 3.`
   - **Without SKU:** `You changed Notebook to a quantity of 2.`
7. The notice is dismissible — click the × to close it.
8. Refresh the page — no notice appears (changes are cleared from the session after being read).

---

## Running E2E Tests

Tests use [Playwright](https://playwright.dev/) and run against the local environment at `http://localhost:8888`. Make sure `wp-env start` is running and the store has been seeded before running them.

### Install Playwright browsers

```bash
npx playwright install chromium
```

### Run all tests

```bash
npx playwright test --config=tests/e2e/playwright.config.ts
```

### Run a specific test file

```bash
npx playwright test tests/e2e/cart-quantity-alert.spec.ts --config=tests/e2e/playwright.config.ts
```

### Run tests with a visible browser (headed mode)

```bash
npx playwright test --config=tests/e2e/playwright.config.ts --headed
```

### Test coverage

| Test | Description |
|------|-------------|
| `no alert on page load` | Cart loads without showing any notice |
| `no alert on page refresh` | Refreshing the cart does not re-show previous notices |
| `alert on quantity change - Product with SKU` | Notice includes product name and SKU |
| `alert on quantity change - Product without SKU` | Notice includes only the product name |
| `no alert when quantity unchanged` | Setting the same quantity does not trigger a notice |

---

## Project Structure

```
plugins/
  wc-quantity-alert/
    wc-quantity-alert.php          # Plugin entry point
    includes/
      class-quantity-tracker.php   # Server-side hooks and Store API extension
    assets/
      quantity-alert.js            # Client-side cart subscriber
scripts/
  setup-storefront.sh              # One-time storefront configuration
  seed-products.sh                 # Sample product seeder
tests/
  e2e/
    cart-quantity-alert.spec.ts    # Playwright E2E tests
    playwright.config.ts           # Playwright configuration
```
