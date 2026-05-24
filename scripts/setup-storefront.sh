set -euo pipefail

echo "=== WC Quantity Alert: Storefront Setup ==="

echo "[1/8] Activating Storefront theme..."
wp theme activate twentytwentyfour --quiet 2>/dev/null || wp theme activate twentytwentyfour

echo "[2/8] Creating WooCommerce pages..."

SHOP_ID=$(wp post list --post_type=page --name=shop --field=ID 2>/dev/null || true)
if [ -z "$SHOP_ID" ]; then
    SHOP_ID=$(wp post create --post_type=page --post_title="Shop" --post_name="shop" \
        --post_content='<!-- wp:woocommerce/product-collection {"query":{"per_page":12}} /-->' \
        --post_status=publish --porcelain)
    echo "Created Shop page (ID: $SHOP_ID)"
else
    echo "Shop page already exists with ID $SHOP_ID. Skipping."
fi
wp option update woocommerce_shop_page_id "$SHOP_ID" --quiet

CART_ID=$(wp post list --post_type=page --name=cart --field=ID 2>/dev/null || true)
if [ -z "$CART_ID" ]; then
    CART_ID=$(wp post create --post_type=page --post_title="Cart" --post_name="cart" \
        --post_content='<!-- wp:woocommerce/cart /-->' \
        --post_status=publish --porcelain)
    echo "Created Cart page (ID: $CART_ID)"
else
    echo "Cart page already exists with ID $CART_ID. Skipping."
fi
wp option update woocommerce_cart_page_id "$CART_ID" --quiet

CHECKOUT_ID=$(wp post list --post_type=page --name=checkout --field=ID 2>/dev/null || true)
if [ -z "$CHECKOUT_ID" ]; then
    CHECKOUT_ID=$(wp post create --post_type=page --post_title="Checkout" --post_name="checkout" \
        --post_content='<!-- wp:woocommerce/checkout /-->' \
        --post_status=publish --porcelain)
    echo "Created Checkout page (ID: $CHECKOUT_ID)"
else
    echo "Checkout page already exists with ID $CHECKOUT_ID. Skipping."
fi
wp option update woocommerce_checkout_page_id "$CHECKOUT_ID" --quiet

echo "[3/8] Configuring WooCommerce settings..."
wp option update woocommerce_currency "USD" --quiet
wp option update woocommerce_default_country "US:CA" --quiet
wp option update woocommerce_calc_taxes "no" --quiet
wp option update woocommerce_enable_guest_checkout "yes" --quiet
wp option update woocommerce_coming_soon "no" --quiet

echo "[4/8] Configuring site settings..."
wp option update blogname "WooCommerce Alert Plugin Demo" --quiet
wp option update blogdescription "A demo store for testing the WooCommerce Alert plugin." --quiet
wp option update show_on_front "page" --quiet

HOME_ID=$(wp post list --post_type=page --name=home --field=ID 2>/dev/null || true)
if [ -z "$HOME_ID" ]; then
    HOME_CONTENT=$(cat <<'EOF'
<!-- wp:heading {"level":1} -->
<h1>WooCommerce Alert Plugin Demo</h1>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Welcome to our demo store! Browse our products and enjoy your shopping experience.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":2} -->
<h2>Featured Products</h2>
<!-- /wp:heading -->

<!-- wp:woocommerce/product-collection {"query":{"per_page":4}} /-->
EOF
)
    HOME_ID=$(wp post create --post_type=page --post_title="Home" --post_name="home" \
        --post_content="$HOME_CONTENT" \
    --post_status=publish --porcelain)
    echo "Created Home page (ID: $HOME_ID)"
else
    echo "Home page already exists with ID $HOME_ID. Skipping."
fi
wp option update page_on_front "$HOME_ID" --quiet

echo "[5/8] Setting up navigation..."
SITE_URL=$(wp option get home)
NAV_CONTENT=$(cat <<EOF
<!-- wp:navigation-link {"label":"Home","type":"custom","url":"${SITE_URL}/","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Shop","type":"custom","url":"${SITE_URL}/shop/","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Cart","type":"custom","url":"${SITE_URL}/cart/","kind":"custom"} /-->
<!-- wp:navigation-link {"label":"Checkout","type":"custom","url":"${SITE_URL}/checkout/","kind":"custom"} /-->
EOF
)

NAV_ID=$(wp post list --post_type=wp_navigation --name=navigation --field=ID 2>/dev/null || true)
if [ -z "$NAV_ID" ]; then
    NAV_ID=$(wp post create --post_type=wp_navigation --post_title="Navigation" --post_name="navigation" \
        --post_content="$NAV_CONTENT" --post_status=publish --porcelain)
    echo "Created Navigation post (ID: $NAV_ID)"
else
    wp post update "$NAV_ID" --post_content="$NAV_CONTENT" --quiet
    echo "Updated Navigation post (ID: $NAV_ID)"
fi

echo "[6/8] Setting up permalinks to post name..."
wp rewrite structure '/%postname%/' --quiet
wp rewrite flush --quiet

echo "[7/8] Activating plugins..."
wp plugin activate wc-quantity-alert --quiet 2>/dev/null || wp plugin activate wc-quantity-alert

echo "[8/8] Storefront setup complete!"
echo ""
echo "Home: http://localhost:8888/"
echo "Shop: http://localhost:8888/shop/"
echo "Cart: http://localhost:8888/cart/"
echo "Admin: http://localhost:8888/wp-admin/"
echo "Login: admin / password"
echo ""
echo "Next step: Run 'scripts/seed-products.sh' to add sample products to the store."