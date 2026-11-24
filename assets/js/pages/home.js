/* PINKLOOP – homepage */
(function () {
  'use strict';

  var esc = PLUI.esc;
  PLUI.renderChrome('home');

  var products = PL.getProducts();
  var categories = PL.getCategories();

  document.getElementById('categoryGrid').innerHTML = categories.map(function (cat) {
    var count = PL.categoryProductCount(cat.category_id);
    return '<a class="category-card" href="/catalog.html?category=' + encodeURIComponent(cat.category_id) + '">' +
      '<span class="category-icon">' + esc(cat.icon || '🏷️') + '</span>' +
      '<strong>' + esc(cat.category_name) + '</strong>' +
      '<span>' + count + ' produk</span></a>';
  }).join('');

  var latest = products.slice().sort(function (a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  }).slice(0, 8);

  document.getElementById('latestGrid').innerHTML = latest.map(PLUI.productCard).join('');

  var popular = products.map(function (p) {
    return { product: p, sold: PL.soldCount(p.product_id) };
  }).sort(function (a, b) {
    if (b.sold !== a.sold) return b.sold - a.sold;
    return new Date(b.product.created_at) - new Date(a.product.created_at);
  }).slice(0, 4);

  document.getElementById('popularGrid').innerHTML = popular.map(function (row) {
    return PLUI.productCard(row.product);
  }).join('');

  PLUI.bindProductGrid(document.getElementById('latestGrid'));
  PLUI.bindProductGrid(document.getElementById('popularGrid'));

  var stats = PL.dashboardStats();
  document.querySelectorAll('[data-stat]').forEach(function (el) {
    var key = el.getAttribute('data-stat');
    if (key === 'products') el.textContent = stats.activeProducts + '+';
    if (key === 'customers') el.textContent = stats.totalCustomers + '+';
    if (key === 'orders') el.textContent = stats.totalOrders + '+';
  });

  var news = document.getElementById('newsletterForm');
  if (news) {
    news.addEventListener('submit', function (e) {
      e.preventDefault();
      PLUI.toast('Terima kasih! Email kamu sudah terdaftar untuk kabar PINKLOOP.', 'success');
      news.reset();
    });
  }
})();
