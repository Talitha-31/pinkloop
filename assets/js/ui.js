/* PINKLOOP – shared UI helpers (header, footer, product card, toast) */
(function (global) {
  'use strict';

  var ICONS = {
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/></svg>',
    heartFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    menu: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.5a2 2 0 0 0 2 1.5h8.4a2 2 0 0 0 2-1.6L22 7H6"/></svg>'
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(message, type) {
    var stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    var el = document.createElement('div');
    el.className = 'toast ' + (type || 'success');
    var icon = type === 'error' ? '⚠️' : type === 'info' ? 'ℹ️' : '✓';
    el.innerHTML = '<span class="t-icon">' + icon + '</span><span>' + esc(message) + '</span>';
    stack.appendChild(el);
    setTimeout(function () {
      el.classList.add('leaving');
      setTimeout(function () { el.remove(); }, 260);
    }, 3200);
  }

  function logoMarkup(settings) {
    if (settings && settings.logo) {
      return '<img class="brand-logo" src="' + esc(settings.logo) + '" alt="Logo ' + esc(settings.store_name || 'PINKLOOP') + '">';
    }
    return '<svg class="brand-logo" viewBox="0 0 44 44" aria-hidden="true">' +
      '<circle cx="22" cy="22" r="21" fill="#F8DDEB"/>' +
      '<path d="M15 16h14a7 7 0 0 1 0 14H15z" fill="none" stroke="#E85D9B" stroke-width="3.2" stroke-linejoin="round"/>' +
      '<path d="M15 9v7" stroke="#E85D9B" stroke-width="3.2" stroke-linecap="round"/>' +
      '</svg>';
  }

  function headerHTML(active) {
    var s = PL.getSettings();
    var name = s.store_name || 'PINKLOOP';
    var links = [
      { href: '/index.html', label: 'Beranda', key: 'home' },
      { href: '/catalog.html', label: 'Katalog', key: 'catalog' },
      { href: '/wishlist.html', label: 'Wishlist', key: 'wishlist' },
      { href: '/orders.html', label: 'Pesanan Saya', key: 'orders' }
    ];
    var nav = links.map(function (l) {
      return '<a href="' + l.href + '"' + (active === l.key ? ' class="active"' : '') + '>' + l.label + '</a>';
    }).join('');
    nav += '<a href="/index.html#tentang">Tentang</a>';
    nav += '<a href="/admin/login/" class="mobile-search">Admin</a>';

    return '' +
      '<div class="container header-inner">' +
        '<a class="brand" href="/index.html" aria-label="' + esc(name) + ' beranda">' +
          logoMarkup(s) + esc(name.slice(0, 4)) + '<span>' + esc(name.slice(4) || 'LOOP') + '</span>' +
        '</a>' +
        '<nav class="main-nav" id="mainNav">' + nav + '</nav>' +
        '<form class="header-search" role="search" id="headerSearchForm">' +
          '<input type="search" name="q" placeholder="Cari blazer, dress, tas…" aria-label="Cari produk">' +
          '<button type="submit" aria-label="Cari">' + ICONS.search + '</button>' +
        '</form>' +
        '<div class="header-actions">' +
          '<a class="icon-btn" href="/wishlist.html" aria-label="Wishlist">' + ICONS.heart +
            '<span class="badge-count" data-wishlist-count hidden>0</span></a>' +
          '<a class="icon-btn" href="/cart.html" aria-label="Keranjang">' + ICONS.bag +
            '<span class="badge-count" data-cart-count hidden>0</span></a>' +
          '<button class="icon-btn menu-toggle" id="menuToggle" aria-label="Buka menu" aria-expanded="false">' + ICONS.menu + '</button>' +
        '</div>' +
      '</div>';
  }

  function footerHTML() {
    var s = PL.getSettings();
    var name = s.store_name || 'PINKLOOP';
    return '' +
      '<div class="container">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<a class="brand" href="/index.html">' + logoMarkup(s) + esc(name.slice(0, 4)) + '<span>' + esc(name.slice(4) || 'LOOP') + '</span></a>' +
            '<p>' + esc(s.description || '').slice(0, 190) + '</p>' +
          '</div>' +
          '<div><h4>Belanja</h4><ul>' +
            '<li><a href="/catalog.html">Semua Produk</a></li>' +
            '<li><a href="/catalog.html?category=CAT-1">Wanita</a></li>' +
            '<li><a href="/catalog.html?category=CAT-2">Pria</a></li>' +
            '<li><a href="/catalog.html?category=CAT-5">Tas &amp; Aksesori</a></li>' +
          '</ul></div>' +
          '<div><h4>Bantuan</h4><ul>' +
            '<li><a href="/orders.html">Lacak Pesanan</a></li>' +
            '<li><a href="/wishlist.html">Wishlist Saya</a></li>' +
            '<li><a href="/index.html#tentang">Cara Belanja</a></li>' +
            '<li><a href="/admin/login/">Login Admin</a></li>' +
          '</ul></div>' +
          '<div><h4>Hubungi Kami</h4><ul>' +
            '<li>' + esc(s.email || '') + '</li>' +
            '<li>WhatsApp ' + esc(s.whatsapp || '') + '</li>' +
            '<li>Jakarta, Indonesia</li>' +
            '<li>Senin–Sabtu, 09.00–18.00</li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>© ' + new Date().getFullYear() + ' ' + esc(name) + '. ' + esc(s.tagline || '') + '</span>' +
          '<span>Dibuat dengan ♡ untuk fashion yang berputar kembali.</span>' +
        '</div>' +
      '</div>';
  }

  function renderChrome(active) {
    var header = document.getElementById('site-header');
    if (header) {
      header.className = 'site-header';
      header.innerHTML = headerHTML(active);
      var form = document.getElementById('headerSearchForm');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var q = form.querySelector('input').value.trim();
          location.href = '/catalog.html' + (q ? '?q=' + encodeURIComponent(q) : '');
        });
      }
      var toggle = document.getElementById('menuToggle');
      var nav = document.getElementById('mainNav');
      if (toggle && nav) {
        toggle.addEventListener('click', function () {
          var open = nav.classList.toggle('open');
          toggle.setAttribute('aria-expanded', String(open));
        });
      }
    }
    var footer = document.getElementById('site-footer');
    if (footer) {
      footer.className = 'site-footer';
      footer.innerHTML = footerHTML();
    }
    updateBadges();
  }

  function updateBadges() {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      var n = PL.cartCount();
      el.textContent = n;
      el.hidden = n === 0;
    });
    document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
      var n = PL.wishlistCount();
      el.textContent = n;
      el.hidden = n === 0;
    });
  }

  function discountPercent(product) {
    if (!product.old_price || product.old_price <= product.price) return 0;
    return Math.round((1 - product.price / product.old_price) * 100);
  }

  function productCard(product) {
    var cat = PL.categoryName(product.category_id);
    var off = discountPercent(product);
    var wished = PL.isWishlisted(product.product_id);
    var soldOut = product.stock < 1;
    return '' +
      '<article class="product-card" data-product="' + esc(product.product_id) + '">' +
        '<a class="product-media" href="/product.html?id=' + encodeURIComponent(product.product_id) + '">' +
          '<img src="' + esc(product.image || '/assets/img/placeholder.svg') + '" alt="' + esc(product.product_name) + '" loading="lazy" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
          '<div class="product-badges">' +
            (off > 0 ? '<span class="chip chip-sale">-' + off + '%</span>' : '') +
            (soldOut ? '<span class="chip chip-out">Stok habis</span>' : '') +
            '<span class="chip chip-condition">' + esc(product.condition) + '</span>' +
          '</div>' +
        '</a>' +
        '<button class="wish-btn' + (wished ? ' active' : '') + '" data-wish="' + esc(product.product_id) + '" aria-label="Simpan ke wishlist" aria-pressed="' + wished + '">' +
          (wished ? ICONS.heartFill : ICONS.heart) +
        '</button>' +
        '<div class="product-body">' +
          '<span class="product-cat">' + esc(cat) + '</span>' +
          '<h3 class="product-name"><a href="/product.html?id=' + encodeURIComponent(product.product_id) + '">' + esc(product.product_name) + '</a></h3>' +
          '<span class="product-meta">Ukuran ' + esc(product.size) + ' · ' + esc(product.brand || 'Tanpa merek') + '</span>' +
          '<div class="price-row">' +
            '<span class="price">' + PL.money(product.price) + '</span>' +
            (product.old_price ? '<span class="price-old">' + PL.money(product.old_price) + '</span>' : '') +
          '</div>' +
          '<div class="product-actions">' +
            '<button class="btn btn-primary" data-add="' + esc(product.product_id) + '"' + (soldOut ? ' disabled' : '') + '>' +
              ICONS.cart + (soldOut ? 'Habis' : 'Tambah') + '</button>' +
            '<a class="btn btn-ghost btn-icon" href="/product.html?id=' + encodeURIComponent(product.product_id) + '" aria-label="Lihat detail">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function bindProductGrid(root) {
    if (!root) return;
    root.addEventListener('click', function (e) {
      var wish = e.target.closest('[data-wish]');
      if (wish) {
        var res = PL.toggleWishlist(wish.getAttribute('data-wish'));
        wish.classList.toggle('active', res.added);
        wish.setAttribute('aria-pressed', String(res.added));
        wish.innerHTML = res.added ? ICONS.heartFill : ICONS.heart;
        toast(res.message, 'success');
        updateBadges();
        return;
      }
      var add = e.target.closest('[data-add]');
      if (add) {
        var r = PL.addToCart(add.getAttribute('data-add'), 1);
        toast(r.message, r.ok ? 'success' : 'error');
        if (r.ok) updateBadges();
      }
    });
  }

  function statusPill(status) {
    var map = { 'Pending': 'pending', 'Diproses': 'diproses', 'Dikirim': 'dikirim', 'Selesai': 'selesai', 'Dibatalkan': 'dibatalkan' };
    return '<span class="status-pill status-' + (map[status] || 'pending') + '">' + esc(status) + '</span>';
  }

  function renderEmpty(title, text, actionHtml) {
    return '<div class="empty"><span class="emoji">🌸</span><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' + (actionHtml || '') + '</div>';
  }

  function queryParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  global.PLUI = {
    ICONS: ICONS,
    esc: esc,
    toast: toast,
    renderChrome: renderChrome,
    updateBadges: updateBadges,
    productCard: productCard,
    bindProductGrid: bindProductGrid,
    discountPercent: discountPercent,
    statusPill: statusPill,
    renderEmpty: renderEmpty,
    queryParam: queryParam,
    logoMarkup: logoMarkup
  };
})(window);
