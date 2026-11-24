/* PINKLOOP – keranjang belanja */
(function () {
  'use strict';
  var esc = PLUI.esc;
  PLUI.renderChrome('cart');

  var root = document.getElementById('cartRoot');

  function render() {
    var summary = PL.cartSummary();
    PLUI.updateBadges();

    if (!summary.items.length) {
      root.innerHTML = PLUI.renderEmpty(
        'Keranjangmu masih kosong',
        'Yuk mulai jelajahi koleksi preloved pilihan kami.',
        '<a class="btn btn-primary btn-sm" href="/catalog.html" style="margin-top:1.2rem">Mulai belanja</a>'
      );
      return;
    }

    var items = summary.items.map(function (item) {
      var unavailable = item.status !== 'Aktif' || item.stock < 1;
      return '' +
        '<div class="cart-item">' +
          '<img src="' + esc(item.image || '/assets/img/placeholder.svg') + '" alt="' + esc(item.product_name) + '" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
          '<div>' +
            '<h3><a href="/product.html?id=' + encodeURIComponent(item.product_id) + '">' + esc(item.product_name) + '</a></h3>' +
            '<div class="meta">Ukuran ' + esc(item.size) + (unavailable ? ' · <b style="color:#b23b52">Stok tidak tersedia</b>' : '') + '</div>' +
            '<div class="price" style="margin-top:.35rem">' + PL.money(item.price) + '</div>' +
          '</div>' +
          '<div class="cart-item-right">' +
            '<div class="qty-control">' +
              '<button type="button" data-dec="' + esc(item.product_id) + '" aria-label="Kurangi">−</button>' +
              '<input type="number" value="' + item.quantity + '" min="1" max="' + Math.max(1, item.stock) + '" data-qty="' + esc(item.product_id) + '" aria-label="Jumlah ' + esc(item.product_name) + '">' +
              '<button type="button" data-inc="' + esc(item.product_id) + '" aria-label="Tambah">+</button>' +
            '</div>' +
            '<div class="small muted">Subtotal: ' + PL.money(item.price * item.quantity) + '</div>' +
            '<button class="link-danger" type="button" data-remove="' + esc(item.product_id) + '">Hapus</button>' +
          '</div>' +
        '</div>';
    }).join('');

    root.innerHTML = '' +
      '<div class="cart-layout">' +
        '<div>' + items +
          '<div class="row-between" style="margin-top:1.2rem">' +
            '<a class="btn btn-ghost btn-sm" href="/catalog.html">← Lanjut belanja</a>' +
            '<button class="link-danger" type="button" id="clearCart">Kosongkan keranjang</button>' +
          '</div>' +
        '</div>' +
        '<aside class="summary">' +
          '<h3>Ringkasan</h3>' +
          '<div class="summary-row"><span>Jumlah barang</span><span>' + summary.count + ' item</span></div>' +
          '<div class="summary-row"><span>Subtotal</span><span>' + PL.money(summary.subtotal) + '</span></div>' +
          '<div class="summary-row"><span>Ongkir (estimasi)</span><span>' + PL.money(summary.shippingCost) + '</span></div>' +
          '<div class="summary-row total"><span>Total belanja</span><span>' + PL.money(summary.total) + '</span></div>' +
          '<a class="btn btn-primary btn-block" href="/checkout.html">Lanjut ke Checkout</a>' +
          '<p class="small muted" style="margin:.7rem 0 0">Ongkir final dihitung saat checkout sesuai metode pengiriman.</p>' +
        '</aside>' +
      '</div>';

    root.querySelectorAll('[data-inc]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-inc');
        var input = root.querySelector('[data-qty="' + id + '"]');
        var res = PL.updateCartQty(id, Number(input.value) + 1);
        if (!res.ok) PLUI.toast(res.message, 'error');
        render();
      });
    });

    root.querySelectorAll('[data-dec]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-dec');
        var input = root.querySelector('[data-qty="' + id + '"]');
        PL.updateCartQty(id, Number(input.value) - 1);
        render();
      });
    });

    root.querySelectorAll('[data-qty]').forEach(function (input) {
      input.addEventListener('change', function () {
        PL.updateCartQty(input.getAttribute('data-qty'), input.value);
        render();
      });
    });

    root.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var res = PL.removeFromCart(btn.getAttribute('data-remove'));
        PLUI.toast(res.message, 'info');
        render();
      });
    });

    var clear = document.getElementById('clearCart');
    if (clear) {
      clear.addEventListener('click', function () {
        if (!confirm('Kosongkan seluruh keranjang?')) return;
        PL.clearCart();
        PLUI.toast('Keranjang dikosongkan.', 'info');
        render();
      });
    }
  }

  render();
})();
