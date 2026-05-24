#!/usr/bin/env bash

set -euo pipefail

create_product() {
    local name="$1"
    local sku="$2"
    local price="$3"
    local description="$4"
    local id
    local existing
    local sku_args=()

    existing=$(wp post list --post_type=product --title="$name" --field=ID 2>/dev/null || true)
    if [[ -n "$existing" ]]; then
        echo "Product '$name' already exists with ID $existing. Skipping."
        return
    fi

    if [[ -n "$sku" ]]; then
        sku_args+=("--sku=$sku")
    fi

    id=$(wp wc product create \
        --name="$name" \
        "${sku_args[@]}" \
        --regular_price="$price" \
        --description="$description" \
        --short_description="$description" \
        --status=publish \
        --user=1 \
        --porcelain)

    echo "Created '$name' (ID: $id, SKU: ${sku:-none}, \$$price)"
}

echo ""
echo "Products with SKU:"
create_product \
    "T-Shirt" \
    "TSHIRT001" \
    "19.99" \
    "A comfortable cotton t-shirt available in various sizes."

create_product \
    "Mug" \
    "MUG001" \
    "9.99" \
    "A ceramic mug perfect for coffee or tea lovers."

create_product \
    "Poster" \
    "POSTER001" \
    "7.99" \
    "A high-quality poster to brighten up your space."

create_product \
    "Notebook" \
    "" \
    "14.99" \
    "A stylish notebook for jotting down your thoughts and ideas."

create_product \
    "Sticker Pack" \
    "" \
    "4.99" \
    "A pack of colorful stickers to decorate your belongings."

echo ""
echo "=== Product Seeding Complete ==="
echo ""
echo "Products with SKU: T-Shirt, Mug, Poster"
echo "Products without SKU: Notebook, Sticker Pack"
echo ""
echo "Visit your WooCommerce store to see the new products!"
echo "http://localhost:8888/shop/"