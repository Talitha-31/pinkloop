/* PINKLOOP – daftar pesanan pengguna (status mengikuti perubahan dari admin) */
(function () {
  'use strict';
  var esc = PLUI.esc;
  PLUI.renderChrome('orders');

  var listEl = document.getElementById('orderList');
  var searchEl = document.getElementById('orderSearch');
  var statusEl = document.getElementById('statusFilter');

  PL.STATUSES.forEach(function (s) {
    var opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    statusEl.appendChild(opt);
  });

  var state = { q: '', status: 'all' };

  function render() {
    var orders = PL.getOrders().filter(function (o) {
      if (state.status !== 'all' && o.order_status !== state.status) return false;
      if (!state.q) return true;
      var hay = (o.order_id + ' ' + o.customer_name + ' ' + o.phone).toLowerCase();
      return hay.indexOf(state.q.toLowerCase()) >= 0;
    });

    if (!orders.length) {
      listEl.innerHTML = PLUI.renderEmpty(
        'Belum ada pesanan',
        state.q || state.status !== 'all'
          ? 'Tidak ada pesanan yang cocok dengan pencarianmu.'
          : 'Pesanan yang kamu buat akan muncul di halaman ini beserta statusnya.',
        '<a class="btn btn-primary btn-sm" href="/catalog.html" style="margin-top:1.2rem">Mulai belanja</a>'
      );
      return;
    }

    listEl.innerHTML = orders.map(function (o) {
      var items = o.items.map(function (it) {
        return '<div class="mini-item">' +
          '<img src="' + esc(it.image || '/assets/img/placeholder.svg') + '" alt="' + esc(it.product_name) + '" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
          '<div><div class="name"><a href="/product.html?id=' + encodeURIComponent(it.product_id) + '">' + esc(it.product_name) + '</a></div>' +
          '<div class="qty">Ukuran ' + esc(it.size) + ' · ' + it.quantity + ' × ' + PL.money(it.price) + '</div></div>' +
          '<strong style="font-size:.82rem">' + PL.money(it.price * it.quantity) + '</strong></div>';
      }).join('');

      return '<article class="order-card">' +
        '<div class="order-card-head">' +
          '<div><div class="id">' + esc(o.order_id) + '</div>' +
          '<div class="small muted">' + PL.formatDateTime(o.order_date) + ' · ' + esc(o.payment_method) + '</div></div>' +
          '<div>' + PLUI.statusPill(o.order_status) + '</div>' +
        '</div>' +
        '<div class="order-items">' + items + '</div>' +
        '<div class="order-foot">' +
          '<div class="small muted">Dikirim ke ' + esc(o.customer_name) + ' — ' + esc(o.shipping_address) + ', ' + esc(o.city) + ' ' + esc(o.postal_code) + '<br>' +
          esc(o.shipping_method) + ' · ' + esc(o.phone) + '</div>' +
          '<div style="text-align:right"><div class="small muted">Total</div><strong>' + PL.money(o.total_price) + '</strong></div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  searchEl.addEventListener('input', function () {
    state.q = searchEl.value.trim();
    render();
  });
  statusEl.addEventListener('change', function () {
    state.status = statusEl.value;
    render();
  });

  render();
})();
