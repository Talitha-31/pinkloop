/* PINKLOOP – katalog produk: pencarian, kategori, filter harga, kondisi, urutan */
(function () {
  'use strict';
  var esc = PLUI.esc;
  PLUI.renderChrome('catalog');

  var all = PL.getProducts();
  var categories = PL.getCategories();
  var params = new URLSearchParams(location.search);

  var state = {
    category: params.get('category') || 'all',
    q: params.get('q') || '',
    min: Number(params.get('min')) || null,
    max: Number(params.get('max')) || null,
    condition: params.get('condition') || 'all',
    sort: params.get('sort') || 'newest'
  };

  var grid = document.getElementById('catalogGrid');
  var emptyBox = document.getElementById('catalogEmpty');
  var resultCount = document.getElementById('resultCount');
  var searchInput = document.getElementById('catalogSearch');
  var sortSelect = document.getElementById('sortSelect');
  var minInput = document.getElementById('minPrice');
  var maxInput = document.getElementById('maxPrice');
  var clearAllBtn = document.getElementById('clearAll');

  searchInput.value = state.q;
  sortSelect.value = state.sort;
  if (state.min) minInput.value = state.min;
  if (state.max) maxInput.value = state.max;

  var conditions = Array.from(new Set(all.map(function (p) { return p.condition; }))).sort();

  function renderCategoryFilter() {
    var counts = { all: all.length };
    categories.forEach(function (c) { counts[c.category_id] = 0; });
    all.forEach(function (p) { counts[p.category_id] = (counts[p.category_id] || 0) + 1; });

    var html = '<button data-cat="all" class="' + (state.category === 'all' ? 'active' : '') + '">' +
      '<span>Semua Produk</span><span class="count">' + counts.all + '</span></button>';
    html += categories.map(function (c) {
      return '<button data-cat="' + esc(c.category_id) + '" class="' + (state.category === c.category_id ? 'active' : '') + '">' +
        '<span>' + esc(c.icon || '') + ' ' + esc(c.category_name) + '</span>' +
        '<span class="count">' + (counts[c.category_id] || 0) + '</span></button>';
    }).join('');
    document.getElementById('categoryFilter').innerHTML = html;
  }

  function renderConditionFilter() {
    var html = '<button data-cond="all" class="' + (state.condition === 'all' ? 'active' : '') + '">Semua kondisi</button>';
    html += conditions.map(function (c) {
      return '<button data-cond="' + esc(c) + '" class="' + (state.condition === c ? 'active' : '') + '">' + esc(c) + '</button>';
    }).join('');
    document.getElementById('conditionFilter').innerHTML = html;
  }

  function matches(p) {
    if (state.category !== 'all' && p.category_id !== state.category) return false;
    if (state.condition !== 'all' && p.condition !== state.condition) return false;
    if (state.min != null && p.price < state.min) return false;
    if (state.max != null && p.price > state.max) return false;
    if (state.q) {
      var hay = (p.product_name + ' ' + (p.brand || '') + ' ' + PL.categoryName(p.category_id)).toLowerCase();
      if (hay.indexOf(state.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function sortList(list) {
    var sorted = list.slice();
    if (state.sort === 'price-asc') return sorted.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === 'price-desc') return sorted.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === 'popular') {
      return sorted.sort(function (a, b) { return PL.soldCount(b.product_id) - PL.soldCount(a.product_id); });
    }
    return sorted.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  }

  function syncUrl() {
    var q = new URLSearchParams();
    if (state.category !== 'all') q.set('category', state.category);
    if (state.q) q.set('q', state.q);
    if (state.min != null) q.set('min', state.min);
    if (state.max != null) q.set('max', state.max);
    if (state.condition !== 'all') q.set('condition', state.condition);
    if (state.sort !== 'newest') q.set('sort', state.sort);
    var url = location.pathname + (q.toString() ? '?' + q.toString() : '');
    history.replaceState(null, '', url);
  }

  function render() {
    var list = sortList(all.filter(matches));
    grid.innerHTML = list.map(PLUI.productCard).join('');
    resultCount.textContent = list.length + ' produk ditemukan';
    emptyBox.hidden = list.length > 0;
    if (!list.length) {
      emptyBox.innerHTML = PLUI.renderEmpty(
        'Produk tidak ditemukan',
        'Coba ubah kata kunci, kategori, atau rentang harga.',
        '<a class="btn btn-primary btn-sm" href="/catalog.html" style="margin-top:1rem">Lihat semua produk</a>'
      );
    }
    var filtered = state.category !== 'all' || state.q || state.min != null || state.max != null || state.condition !== 'all';
    clearAllBtn.hidden = !filtered;
    var cat = categories.find(function (c) { return c.category_id === state.category; });
    document.getElementById('catalogSubtitle').textContent = cat
      ? 'Kategori ' + cat.category_name + ' — ' + PL.categoryProductCount(cat.category_id) + ' produk terkurasi.'
      : 'Semua produk terkurasi, siap pakai, dan siap dikirim.';
    renderCategoryFilter();
    renderConditionFilter();
    syncUrl();
  }

  document.getElementById('categoryFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.category = btn.getAttribute('data-cat');
    render();
  });

  document.getElementById('conditionFilter').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cond]');
    if (!btn) return;
    state.condition = btn.getAttribute('data-cond');
    render();
  });

  document.getElementById('catalogSearchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    state.q = searchInput.value.trim();
    render();
  });

  searchInput.addEventListener('input', function () {
    state.q = searchInput.value.trim();
    render();
  });

  sortSelect.addEventListener('change', function () {
    state.sort = sortSelect.value;
    render();
  });

  document.getElementById('applyPrice').addEventListener('click', function () {
    var min = Number(minInput.value);
    var max = Number(maxInput.value);
    if (minInput.value && maxInput.value && min > max) {
      PLUI.toast('Harga minimum tidak boleh lebih besar dari maksimum.', 'error');
      return;
    }
    state.min = minInput.value ? min : null;
    state.max = maxInput.value ? max : null;
    render();
  });

  document.getElementById('resetFilter').addEventListener('click', function () {
    state.min = null;
    state.max = null;
    minInput.value = '';
    maxInput.value = '';
    render();
  });

  document.getElementById('clearAll').addEventListener('click', function () {
    state = { category: 'all', q: '', min: null, max: null, condition: 'all', sort: 'newest' };
    searchInput.value = '';
    sortSelect.value = 'newest';
    minInput.value = '';
    maxInput.value = '';
    render();
  });

  document.getElementById('filterToggle').addEventListener('click', function () {
    document.getElementById('filters').classList.toggle('open');
  });

  PLUI.bindProductGrid(grid);
  render();
})();
