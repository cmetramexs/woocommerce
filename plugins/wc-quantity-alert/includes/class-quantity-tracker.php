<?php

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class WC_Quantity_Tracker {
    public function __construct() {
        add_action(
            'woocommerce_after_cart_item_quantity_update',
            array($this, 'track_quantity_change'),
            10,
            4
        );

        add_action(
            'woocommerce_blocks_loaded',
            array($this, 'extend_store_api')
        );

        add_action(
            'wp_enqueue_scripts',
            array($this, 'enqueue_scripts'),
            20
        );
    }

    public function enqueue_scripts() {
        if (function_exists('is_cart') && is_cart()) {
            $script_path = WC_QUANTITY_ALERT_PLUGIN_DIR . 'assets/quantity-alert.js';
            $script_version = file_exists($script_path) ? (string) filemtime($script_path) : '1.0.0';

            wp_enqueue_script(
                'wc-quantity-alert',
                WC_QUANTITY_ALERT_PLUGIN_URL . 'assets/quantity-alert.js',
                array('wp-data', 'wp-notices', 'wc-blocks-data-store'),
                $script_version,
                true
            );
        }

        if (function_exists('is_shop') && is_shop()) {
            $shop_script_path = WC_QUANTITY_ALERT_PLUGIN_DIR . 'assets/shop-quantity-alert.js';
            $shop_script_version = file_exists($shop_script_path) ? (string) filemtime($shop_script_path) : '1.0.0';

            wp_enqueue_script(
                'wc-shop-quantity-alert',
                WC_QUANTITY_ALERT_PLUGIN_URL . 'assets/shop-quantity-alert.js',
                array(),
                $shop_script_version,
                true
            );
        }
    }

    public function track_quantity_change($cart_item_key, $quantity, $old_quantity, $cart) {
        if ((int) $quantity === (int) $old_quantity || !WC()->session) {
            return;
        }

        $cart_item = method_exists($cart, 'get_cart_item')
            ? $cart->get_cart_item($cart_item_key)
            : (isset($cart->cart_contents[$cart_item_key]) ? $cart->cart_contents[$cart_item_key] : null);

        if (!is_array($cart_item) || empty($cart_item['data']) || !is_a($cart_item['data'], 'WC_Product')) {
            return;
        }

        $product = $cart_item['data'];
        $changes = array(
            array(
            'name' => $product->get_name(),
            'sku' => $product->get_sku(),
            'quantity' => (int) $quantity,
            )
        );

        WC()->session->set('wc_qty_changes', $changes);
    }

    public function extend_store_api() {
        if (!function_exists('woocommerce_store_api_register_endpoint_data')) {
            return;
        }

        woocommerce_store_api_register_endpoint_data(
            array(
                'endpoint' => \Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema::IDENTIFIER,
                'namespace' => 'wc-quantity-alert',
                'data_callback' => array($this, 'store_api_data_callback'),
                'schema_callback' => array($this, 'store_api_schema_callback'),
                'schema_type' => ARRAY_N,
            )
        );
    }

    public function store_api_data_callback() {
        if (!WC()->session) {
            return array();
        }

        $changes = WC()->session->get('wc_qty_changes', array());
        WC()->session->set('wc_qty_changes', array());

        return $changes;
    }

    public function store_api_schema_callback() {
        return array(
            'name' => array(
                'description' => 'Product name',
                'type' => 'string',
                'context' => array('view', 'edit'),
                'readonly' => true,
            ),
            'sku' => array(
                'description' => 'Product SKU',
                'type' => 'string',
                'context' => array('view', 'edit'),
                'readonly' => true,
            ),
            'quantity' => array(
                'description' => 'New quantity after change',
                'type' => 'integer',
                'context' => array('view', 'edit'),
                'readonly' => true,
            ),
        );
    }
}