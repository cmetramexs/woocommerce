(function() {
    'use strict';

    var noticeClass = 'wc-quantity-alert-shop-notice';
    var buttonSelector = '.wc-block-components-product-button__button';

    function parseQuantity(text) {
        var match = String(text || '').match(/(\d+)\s+in cart/i);
        return match ? Number(match[1]) : null;
    }

    function getProductName(button) {
        var item = button.closest('li');
        var titleLink = item ? item.querySelector('h2 a, .wp-block-post-title a') : null;
        return titleLink ? titleLink.textContent.trim() : 'this product';
    }

    function getProductSku(button) {
        var sku = button.getAttribute('data-product_sku');
        return sku ? sku.trim() : '';
    }

    function ensureNoticeWrapper() {
        var main = document.querySelector('main');
        if (!main) {
            return null;
        }

        var existing = main.querySelector('.' + noticeClass);
        if (existing) {
            return existing;
        }

        var notice = document.createElement('div');
        notice.className = noticeClass + ' woocommerce-message';
        notice.setAttribute('role', 'alert');
        main.insertBefore(notice, main.firstChild.nextSibling || main.firstChild);
        return notice;
    }

    function showNotice(button, quantity) {
        var notice = ensureNoticeWrapper();
        if (!notice) {
            return;
        }

        var name = getProductName(button);
        var sku = getProductSku(button);

        if (sku) {
            notice.textContent = 'You changed ' + name + ' (SKU: ' + sku + ') to a quantity of ' + quantity + '.';
            return;
        }

        notice.textContent = 'You changed ' + name + ' to a quantity of ' + quantity + '.';
    }

    function observeButton(button) {
        var previousQuantity = parseQuantity(button.textContent);

        button.dataset.wcQuantityAlertReady = 'true';

        var observer = new MutationObserver(function() {
            var nextQuantity = parseQuantity(button.textContent);

            if (nextQuantity === null || nextQuantity === previousQuantity) {
                return;
            }

            previousQuantity = nextQuantity;
            showNotice(button, nextQuantity);
        });

        observer.observe(button, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    function init() {
        var buttons = document.querySelectorAll(buttonSelector);
        buttons.forEach(function(button) {
            if (button.dataset.wcQuantityAlertReady === 'true') {
                return;
            }

            observeButton(button);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();