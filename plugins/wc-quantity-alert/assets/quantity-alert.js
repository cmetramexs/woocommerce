(function() {
    'use strict';

    var subscribe = wp.data.subscribe;
    var select = wp.data.select;
    var dispatch = wp.data.dispatch;
    var noticeStore = dispatch('core/notices');

    var lastProcessedJson = '';
    var hasSeenInitialState = false;
    var noticeId = 'wc-quantity-alert-notice';

    subscribe(function() {
        var store = select('wc/store/cart');
        if (!store || typeof store.getCartData !== 'function') {
            return;
        }

        var cartData = store.getCartData();
        var extensions = cartData && cartData.extensions
            ? cartData.extensions
            : null;

        if (!extensions) {
            return;
        }

        var changes = Array.isArray(extensions['wc-quantity-alert'])
            ? extensions['wc-quantity-alert']
            : [];

        var currentJson = JSON.stringify(changes);

        if (!hasSeenInitialState) {
            hasSeenInitialState = true;
            lastProcessedJson = currentJson;
            return;
        }

        if (changes.length === 0) {
            return;
        }

        if (currentJson === lastProcessedJson) {
            return;
        }
        lastProcessedJson = currentJson;

        var messages = changes.map(function(item) {
            if (item.sku && item.sku.length > 0) {
                return 'You changed ' + item.name + ' (SKU: ' + item.sku + ') to a quantity of ' + item.quantity + '.';
            }
            return 'You changed ' + item.name + ' to a quantity of ' + item.quantity + '.';
        });

        var notice = messages.join('\n');

        noticeStore.removeNotice(noticeId, 'wc/cart');

        noticeStore.createNotice(
            'success',
            notice,
            {
                id: noticeId,
                context: 'wc/cart',
                isDismissible: true,
            }
        );
    });
})();