/* PINKLOOP – halaman detail produk */
(function () {
  'use strict';
  var esc = PLUI.esc;
  PLUI.renderChrome('catalog');

  var id = PLUI.queryParam('id');
  var product = id ? PL.getProduct(id) : null;
  var root = document.getElementById('detailRoot');

  if (!product || product.status !== 'Aktif') {
    document.getElementById('pageTitle').textContent = 'Produk tidak tersedia';
    root.innerHTML = PLUI.renderEmpty(
      'Produk tidak tersedia',
      'Produk ini mungkin sudah dihapus, dinonaktifkan, atau terjual habis.',
      '<a class="btn btn-primary btn-sm" href="/catalog.html" style="margin-top:1.2rem">Kembali ke katalog</a>'
    );
    return;
  }

  var cat = PL.categoryName(product.category_id);
  var off = PLUI.discountPercent(product);
  var wished = PL.isWishlisted(product.product_id);

  document.title = product.product_name + ' – PINKLOOP';
  document.getElementById('pageTitle').textContent = product.product_name;
  document.getElementById('breadcrumb').innerHTML =
    '<a href="/index.html">Beranda</a> <span>/</span>' +
    '<a href="/catalog.html">Katalog</a> <span>/</span>' +
    '<a href="/catalog.html?category=' + encodeURIComponent(product.category_id) + '">' + esc(cat) + '</a>' +
    '<span>/</span><span>' + esc(product.product_name) + '</span>';

  root.innerHTML = '' +
    '<div class="detail-layout">' +
      '<div>' +
        '<div class="detail-gallery">' +
          '<img id="mainImage" src="' + esc(product.image || '/assets/img/placeholder.svg') + '" alt="' + esc(product.product_name) + '" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
        '</div>' +
      '</div>' +
      '<div class="detail-info">' +
        '<span class="eyebrow">' + esc(cat) + '</span>' +
        '<h2 style="margin-bottom:.3rem">' + esc(product.product_name) + '</h2>' +
        '<div class="row-between" style="justify-content:flex-start;gap:.8rem">' +
          '<span class="product-meta">Merek ' + esc(product.brand || '-') + '</span>' +
          '<span class="chip chip-condition">' + esc(product.condition) + '</span>' +
        '</div>' +
        '<div class="price-row">' +
          '<span class="price">' + PL.money(product.price) + '</span>' +
          (product.old_price ? '<span class="price-old">' + PL.money(product.old_price) + '</span>' : '') +
          (off > 0 ? '<span class="discount">Hemat ' + off + '%</span>' : '') +
        '</div>' +
        '<p class="detail-desc">' + esc(product.description || 'Belum ada deskripsi untuk produk ini.') + '</p>' +
        '<div class="spec-grid">' +
          '<div class="spec"><span>Kategori</span><strong>' + esc(cat) + '</strong></div>' +
          '<div class="spec"><span>Ukuran</span><strong>' + esc(product.size) + '</strong></div>' +
          '<div class="spec"><span>Kondisi</span><strong>' + esc(product.condition) + '</strong></div>' +
          '<div class="spec"><span>Merek</span><strong>' + esc(product.brand || '-') + '</strong></div>' +
          '<div class="spec"><span>Stok</span><strong>' + (product.stock > 0 ? product.stock + ' tersedia' : 'Habis') + '</strong></div>' +
          '<div class="spec"><span>Kode Produk</span><strong>' + esc(product.product_id) + '</strong></div>' +
        '</div>' +
        '<div class="buy-panel">' +
          '<div class="row-between">' +
            '<div class="qty-control">' +
              '<button type="button" id="qtyMinus" aria-label="Kurangi jumlah">−</button>' +
              '<input id="qtyInput" type="number" value="1" min="1" max="' + Math.max(1, product.stock) + '" aria-label="Jumlah">' +
              '<button type="button" id="qtyPlus" aria-label="Tambah jumlah">+</button>' +
            '</div>' +
            '<span class="stock-note">Stok tersedia: <b>' + product.stock + '</b></span>' +
          '</div>' +
          '<div class="product-actions" style="margin-top:0">' +
            '<button class="btn btn-primary" id="addToCartBtn"' + (product.stock < 1 ? ' disabled' : '') + '>' +
              (product.stock < 1 ? 'Stok habis' : 'Tambah ke Keranjang') + '</button>' +
            '<button class="btn btn-ghost" id="wishBtn">' + (wished ? '♥ Tersimpan' : '♡ Wishlist') + '</button>' +
          '</div>' +
          '<a class="btn btn-soft btn-block" href="/cart.html">Lihat Keranjang</a>' +
          '<p class="small muted" style="margin:0">Dikirim dari Jakarta · Estimasi 2–4 hari kerja · Barang sudah dicuci bersih.</p>' +
        '</div>' +
      '</div>' +
    '</div>';

  var qtyInput = document.getElementById('qtyInput');
  var maxQty = Math.max(1, product.stock);

  document.getElementById('qtyMinus').addEventListener('click', function () {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById('qtyPlus').addEventListener('click', function () {
    qtyInput.value = Math.min(maxQty, Number(qtyInput.value) + 1);
  });
  qtyInput.addEventListener('change', function () {
    var v = Math.min(maxQty, Math.max(1, Number(qtyInput.value) || 1));
    qtyInput.value = v;
  });

  document.getElementById('addToCartBtn').addEventListener('click', function () {
    var res = PL.addToCart(product.product_id, Number(qtyInput.value) || 1);
    PLUI.toast(res.message, res.ok ? 'success' : 'error');
    if (res.ok) PLUI.updateBadges();
  });

  document.getElementById('wishBtn').addEventListener('click', function (e) {
    var res = PL.toggleWishlist(product.product_id);
    e.currentTarget.innerHTML = res.added ? '♥ Tersimpan' : '♡ Wishlist';
    PLUI.toast(res.message, 'success');
    PLUI.updateBadges();
  });

  var related = PL.getProducts().filter(function (p) {
    return p.category_id === product.category_id && p.product_id !== product.product_id;
  }).slice(0, 4);

  if (related.length) {
    document.getElementById('relatedSection').hidden = false;
    document.getElementById('relatedGrid').innerHTML = related.map(PLUI.productCard).join('');
    PLUI.bindProductGrid(document.getElementById('relatedGrid'));
  }
})();
