/* PINKLOOP – checkout & pembuatan pesanan */
(function () {
  'use strict';
  var esc = PLUI.esc;
  PLUI.renderChrome('cart');

  var root = document.getElementById('checkoutRoot');
  var summary = PL.cartSummary();

  if (!summary.items.length) {
    root.innerHTML = PLUI.renderEmpty(
      'Belum ada barang untuk di-checkout',
      'Tambahkan produk ke keranjang terlebih dahulu, lalu kembali ke halaman ini.',
      '<a class="btn btn-primary btn-sm" href="/catalog.html" style="margin-top:1.2rem">Belanja sekarang</a>'
    );
    return;
  }

  var shippingOptions = Object.keys(PL.SHIPPING);
  var settings = PL.getSettings();

  function itemRows() {
    return summary.items.map(function (it) {
      return '<div class="mini-item">' +
        '<img src="' + esc(it.image || '/assets/img/placeholder.svg') + '" alt="' + esc(it.product_name) + '" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
        '<div><div class="name">' + esc(it.product_name) + '</div>' +
        '<div class="qty">Ukuran ' + esc(it.size) + ' · ' + it.quantity + ' × ' + PL.money(it.price) + '</div></div>' +
        '<strong style="font-size:.84rem">' + PL.money(it.price * it.quantity) + '</strong>' +
        '</div>';
    }).join('');
  }

  function summaryHTML(shippingCost) {
    return '<h3>Ringkasan Pesanan</h3>' +
      itemRows() +
      '<div class="summary-row" style="margin-top:.8rem"><span>Subtotal (' + summary.count + ' item)</span><span>' + PL.money(summary.subtotal) + '</span></div>' +
      '<div class="summary-row"><span>Ongkos kirim</span><span>' + PL.money(shippingCost) + '</span></div>' +
      '<div class="summary-row total"><span>Total bayar</span><span id="grandTotal">' + PL.money(summary.subtotal + shippingCost) + '</span></div>';
  }

  root.innerHTML = '' +
    '<div class="checkout-layout">' +
      '<form class="card-panel" id="checkoutForm" novalidate>' +
        '<div class="form-section-title">Data Penerima</div>' +
        '<div class="form-grid">' +
          '<div class="field full"><label for="name">Nama penerima <span class="req">*</span></label>' +
            '<input id="name" name="name" type="text" placeholder="Nama lengkap" autocomplete="name"></div>' +
          '<div class="field"><label for="phone">Nomor WhatsApp <span class="req">*</span></label>' +
            '<input id="phone" name="phone" type="tel" placeholder="08xxxxxxxxxx" inputmode="numeric" autocomplete="tel">' +
            '<span class="hint">Nomor aktif untuk konfirmasi pesanan.</span></div>' +
          '<div class="field"><label for="email">Email (opsional)</label>' +
            '<input id="email" name="email" type="email" placeholder="nama@email.com" autocomplete="email"></div>' +
        '</div>' +
        '<div class="form-section-title">Alamat Pengiriman</div>' +
        '<div class="form-grid">' +
          '<div class="field full"><label for="address">Alamat lengkap <span class="req">*</span></label>' +
            '<textarea id="address" name="address" placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan" autocomplete="street-address"></textarea></div>' +
          '<div class="field"><label for="city">Kota / Kabupaten <span class="req">*</span></label>' +
            '<input id="city" name="city" type="text" placeholder="Contoh: Jakarta Selatan" autocomplete="address-level2"></div>' +
          '<div class="field"><label for="postal_code">Kode pos <span class="req">*</span></label>' +
            '<input id="postal_code" name="postal_code" type="text" placeholder="5 angka" inputmode="numeric" maxlength="5" autocomplete="postal-code"></div>' +
          '<div class="field full"><label for="note">Catatan untuk penjual (opsional)</label>' +
            '<input id="note" name="note" type="text" placeholder="Contoh: titip di resepsionis"></div>' +
        '</div>' +
        '<div class="form-section-title">Metode Pengiriman</div>' +
        '<div class="pay-options" id="shippingOptions">' +
          shippingOptions.map(function (opt, i) {
            return '<label class="pay-option' + (i === 0 ? ' selected' : '') + '">' +
              '<input type="radio" name="shipping_method" value="' + esc(opt) + '"' + (i === 0 ? ' checked' : '') + '>' +
              '<span>' + esc(opt) + '</span>' +
              '<strong style="margin-left:auto">' + (PL.SHIPPING[opt] ? PL.money(PL.SHIPPING[opt]) : 'Gratis') + '</strong>' +
            '</label>';
          }).join('') +
        '</div>' +
        '<div class="form-section-title">Metode Pembayaran</div>' +
        '<div class="pay-options" id="paymentOptions">' +
          PL.PAYMENTS.map(function (opt, i) {
            return '<label class="pay-option' + (i === 0 ? ' selected' : '') + '">' +
              '<input type="radio" name="payment_method" value="' + esc(opt) + '"' + (i === 0 ? ' checked' : '') + '>' +
              '<span>' + esc(opt) + '</span>' +
            '</label>';
          }).join('') +
        '</div>' +
        '<div class="row-between" style="margin-top:1.6rem">' +
          '<a class="btn btn-ghost" href="/cart.html">← Kembali ke keranjang</a>' +
          '<button class="btn btn-primary" type="submit" id="placeOrderBtn">Buat Pesanan</button>' +
        '</div>' +
      '</form>' +
      '<aside class="summary" id="checkoutSummary">' + summaryHTML(PL.SHIPPING[shippingOptions[0]]) + '</aside>' +
    '</div>';

  function refreshTotals() {
    var checked = root.querySelector('input[name="shipping_method"]:checked');
    var cost = PL.SHIPPING[checked ? checked.value : shippingOptions[0]] || 0;
    document.getElementById('checkoutSummary').innerHTML = summaryHTML(cost);
    root.querySelectorAll('.pay-option input').forEach(function (input) {
      input.closest('.pay-option').classList.toggle('selected', input.checked);
    });
  }

  root.addEventListener('change', function (e) {
    if (e.target.name === 'shipping_method' || e.target.name === 'payment_method') refreshTotals();
  });

  function markInvalid(fieldName, invalid) {
    var input = root.querySelector('[name="' + fieldName + '"]');
    if (!input) return;
    input.closest('.field').classList.toggle('invalid', invalid);
  }

  var form = document.getElementById('checkoutForm');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var field = function (id) { return (root.querySelector('#' + id) || {}).value || ''; };
    var data = {
      name: field('name').trim(),
      phone: field('phone').trim(),
      email: field('email').trim(),
      address: field('address').trim(),
      city: field('city').trim(),
      postal_code: field('postal_code').trim(),
      shipping_method: (form.querySelector('input[name="shipping_method"]:checked') || {}).value,
      payment_method: (form.querySelector('input[name="payment_method"]:checked') || {}).value,
      note: field('note').trim()
    };

    var invalid = [];
    if (!data.name) invalid.push('name');
    if (!/^0[0-9]{8,13}$/.test(data.phone.replace(/[\s-]/g, ''))) invalid.push('phone');
    if (!data.address) invalid.push('address');
    if (!data.city) invalid.push('city');
    if (!/^[0-9]{5}$/.test(data.postal_code)) invalid.push('postal_code');

    ['name', 'phone', 'address', 'city', 'postal_code'].forEach(function (f) {
      markInvalid(f, invalid.indexOf(f) >= 0);
    });

    if (invalid.length) {
      var labels = { name: 'nama penerima', phone: 'nomor WhatsApp', address: 'alamat lengkap', city: 'kota', postal_code: 'kode pos' };
      PLUI.toast('Mohon lengkapi: ' + invalid.map(function (f) { return labels[f]; }).join(', ') + '.', 'error');
      return;
    }

    var btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;

    var res = PL.createOrder(data);
    if (!res.ok) {
      btn.disabled = false;
      PLUI.toast(res.message, 'error');
      return;
    }

    var order = res.order;
    var rows = order.items.map(function (it) {
      return '<div class="mini-item">' +
        '<img src="' + esc(it.image || '/assets/img/placeholder.svg') + '" alt="' + esc(it.product_name) + '">' +
        '<div><div class="name">' + esc(it.product_name) + '</div><div class="qty">' + it.quantity + ' × ' + PL.money(it.price) + '</div></div>' +
        '<strong style="font-size:.82rem">' + PL.money(it.price * it.quantity) + '</strong></div>';
    }).join('');

    root.innerHTML = '' +
      '<div class="card-panel" style="max-width:720px;margin-inline:auto;text-align:center">' +
        '<div style="width:74px;height:74px;border-radius:50%;background:#E4F6EA;color:#2c7a4b;display:grid;place-items:center;margin:0 auto 1rem;font-size:2rem">✓</div>' +
        '<h2>Pesanan berhasil dibuat!</h2>' +
        '<p class="muted">Terima kasih, ' + esc(order.customer_name) + '. Pesananmu sudah masuk ke sistem PINKLOOP dan akan segera dikonfirmasi.</p>' +
        '<div style="background:#FFF8FC;border:1px solid var(--line);border-radius:18px;padding:1.2rem;text-align:left;margin:1.4rem 0">' +
          '<div class="row-between" style="margin-bottom:.8rem">' +
            '<div><span class="small muted">Nomor pesanan</span><div style="font-weight:600;font-size:1.1rem">' + esc(order.order_id) + '</div></div>' +
            PLUI.statusPill(order.order_status) +
          '</div>' +
          rows +
          '<div class="summary-row total"><span>Total dibayar</span><span>' + PL.money(order.total_price) + '</span></div>' +
          '<div class="small muted" style="margin-top:.6rem">' + esc(order.payment_method) + ' · ' + esc(order.shipping_method) + '<br>' +
            esc(order.shipping_address) + ', ' + esc(order.city) + ' ' + esc(order.postal_code) + '</div>' +
        '</div>' +
        '<div class="row-between" style="justify-content:center;gap:.6rem;flex-wrap:wrap">' +
          '<a class="btn btn-primary" href="/orders.html">Lacak Pesanan</a>' +
          '<a class="btn btn-ghost" href="/catalog.html">Lanjut belanja</a>' +
        '</div>' +
        '<p class="small muted" style="margin-top:1.2rem">Simpan nomor pesananmu. Hubungi ' + esc(settings.whatsapp) + ' bila ada pertanyaan.</p>' +
      '</div>';

    PLUI.updateBadges();
    PLUI.toast(res.message, 'success');
  });
})();
