<?php
/**
 * Plugin Name: WC Quantity Alert
 * Description: Quantity change alerts for WooCommerce cart and shop experiences.
 * Version: 1.0.0
 * Author: cmexs
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// Resolve plugin asset and include paths from the bootstrap file location.
define('WC_QUANTITY_ALERT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WC_QUANTITY_ALERT_PLUGIN_URL', plugin_dir_url(__FILE__));

add_action('plugins_loaded', function() {
    // Delay class loading until plugins are available so WooCommerce hooks can be registered safely.
    require_once WC_QUANTITY_ALERT_PLUGIN_DIR . 'includes/class-quantity-tracker.php';
    new WC_Quantity_Tracker();
});