/* PINKLOOP – admin dashboard views */
(function () {
  'use strict';

  if (!PL.isAdmin()) {
    location.replace('/admin/login/');
    return;
  }

  var esc = ADM.esc;
  var toast = ADM.toast;
  var root = document.getElementById('viewRoot');

  ADM.mountShell();

  /* ---------- helpers ---------- */
  function startOfDay(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function addDays(date, n) {
    var d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }
  function dayLabel(date) {
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }
  function weekStart(date) {
    var d = startOfDay(date);
    var day = (d.getDay() + 6) % 7; // Senin = 0
    return addDays(d, -day);
  }
  function validOrders(orders) {
    return orders.filter(function (o) { return o.order_status !== 'Dibatalkan'; });
  }
  function unitsOf(orders) {
    return orders.reduce(function (sum, o) {
      return sum + o.items.reduce(function (s, it) { return s + it.quantity; }, 0);
    }, 0);
  }
  function periodStart(period) {
    var now = new Date();
    if (period === 'today') return startOfDay(now);
    if (period === '7') return addDays(startOfDay(now), -6);
    if (period === '30') return addDays(startOfDay(now), -29);
    if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    return null;
  }
  function withinPeriod(orders, period) {
    var start = periodStart(period);
    if (!start) return orders;
    return orders.filter(function (o) { return new Date(o.order_date) >= start; });
  }

  function emptyRow(cols, text) {
    return '<tr><td colspan="' + cols + '"><div class="empty-state"><span class="emoji">🌸</span>' +
      esc(text || 'Belum ada data.') + '</div></td></tr>';
  }

  /* ---------- dashboard ---------- */
  function dashboard() {
    ADM.setHeader('Dashboard', 'Ringkasan performa toko PINKLOOP');
    var stats = PL.dashboardStats();
    var orders = PL.getOrders();
    var products = PL.getProducts({ includeInactive: true });
    var valid = validOrders(orders);

    var days = [];
    for (var i = 6; i >= 0; i--) days.push(addDays(new Date(), -i));

    var salesSeries = days.map(function (d) {
      var key = PL.dateKey(d);
      var value = valid.filter(function (o) { return PL.dateKey(o.order_date) === key; })
        .reduce(function (s, o) { return s + o.total_price; }, 0);
      return { label: d.toLocaleDateString('id-ID', { weekday: 'short' }), value: value };
    });

    var orderSeries = days.map(function (d) {
      var key = PL.dateKey(d);
      var value = orders.filter(function (o) { return PL.dateKey(o.order_date) === key; }).length;
      return { label: d.toLocaleDateString('id-ID', { weekday: 'short' }), value: value };
    });

    var bestSellers = products.map(function (p) {
      return { product: p, sold: PL.soldCount(p.product_id, orders) };
    }).sort(function (a, b) { return b.sold - a.sold; }).slice(0, 5);

    var recent = orders.slice(0, 5);
    var newest = products.slice().sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    }).slice(0, 4);

    root.innerHTML = '' +
      '<section class="stat-grid">' +
        '<div class="stat-card"><div class="stat-ico">👕</div><div>' +
          '<div class="stat-label">Total Products</div>' +
          '<div class="stat-value">' + stats.totalProducts + '</div>' +
          '<div class="stat-note">' + stats.activeProducts + ' aktif · ' + stats.lowStock + ' stok menipis</div>' +
        '</div></div>' +
        '<div class="stat-card"><div class="stat-ico">🧾</div><div>' +
          '<div class="stat-label">Total Orders</div>' +
          '<div class="stat-value">' + stats.totalOrders + '</div>' +
          '<div class="stat-note">' + stats.pendingOrders + ' menunggu diproses</div>' +
        '</div></div>' +
        '<div class="stat-card"><div class="stat-ico">👥</div><div>' +
          '<div class="stat-label">Total Customers</div>' +
          '<div class="stat-value">' + stats.totalCustomers + '</div>' +
          '<div class="stat-note">' + stats.unitsSold + ' item terjual</div>' +
        '</div></div>' +
        '<div class="stat-card"><div class="stat-ico">💰</div><div>' +
          '<div class="stat-label">Total Revenue</div>' +
          '<div class="stat-value">' + PL.shortMoney(stats.revenue) + '</div>' +
          '<div class="stat-note">' + PL.money(stats.revenue) + '</div>' +
        '</div></div>' +
      '</section>' +

      '<section class="grid-2-even">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Grafik penjualan</h2><p>Pendapatan 7 hari terakhir</p></div>' +
            '<span class="pill pill-green">' + PL.shortMoney(salesSeries.reduce(function (s, d) { return s + d.value; }, 0)) + '</span></div>' +
          ADM.lineChart(salesSeries, { id: 'sales', color: '#E85D9B', formatY: function (v) { return v >= 1000 ? Math.round(v / 1000) + 'rb' : Math.round(v); } }) +
          '<div class="chart-legend"><span><span class="dot" style="background:#E85D9B"></span>Pendapatan harian</span></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Grafik jumlah pesanan</h2><p>Order masuk 7 hari terakhir</p></div>' +
            '<span class="pill pill-purple">' + orderSeries.reduce(function (s, d) { return s + d.value; }, 0) + ' order</span></div>' +
          ADM.barChart(orderSeries, { color: '#B79BE6' }) +
          '<div class="chart-legend"><span><span class="dot" style="background:#B79BE6"></span>Jumlah pesanan</span></div>' +
        '</div>' +
      '</section>' +

      '<section class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Pesanan terbaru</h2><p>5 transaksi terakhir</p></div>' +
            '<a class="btn btn-ghost btn-sm" href="#orders">Lihat semua</a></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr>' +
            '<th>Order ID</th><th>Pembeli</th><th>Total</th><th>Status</th></tr></thead><tbody>' +
            (recent.length ? recent.map(function (o) {
              return '<tr><td><strong>' + esc(o.order_id) + '</strong></td>' +
                '<td>' + esc(o.customer_name) + '<div class="small muted">' + PL.formatDate(o.order_date) + '</div></td>' +
                '<td class="mono">' + PL.money(o.total_price) + '</td>' +
                '<td>' + ADM.statusPill(o.order_status) + '</td></tr>';
            }).join('') : emptyRow(4, 'Belum ada pesanan masuk.')) +
          '</tbody></table></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Produk paling banyak terjual</h2><p>Berdasarkan unit terjual</p></div></div>' +
          '<div class="rank-list">' + (bestSellers.length ? bestSellers.map(function (row, i) {
            return '<div class="rank-item">' +
              '<div class="rank-num">' + (i + 1) + '</div>' +
              '<img src="' + esc(row.product.image || '/assets/img/placeholder.svg') + '" alt="" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
              '<div><div class="nm">' + esc(row.product.product_name) + '</div>' +
              '<div class="sub">' + esc(PL.categoryName(row.product.category_id)) + '</div></div>' +
              '<strong class="small">' + row.sold + ' terjual</strong>' +
            '</div>';
          }).join('') : '<div class="empty-state">Belum ada penjualan.</div>') + '</div>' +
        '</div>' +
      '</section>' +

      '<section class="panel">' +
        '<div class="panel-head"><div><h2>Produk terbaru</h2><p>Ditambahkan ke katalog</p></div>' +
          '<a class="btn btn-ghost btn-sm" href="#products">Kelola produk</a></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th></tr></thead><tbody>' +
          (newest.length ? newest.map(function (p) {
            return '<tr><td><div class="cell-product">' +
              '<img class="thumb" src="' + esc(p.image || '/assets/img/placeholder.svg') + '" alt="" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
              '<div><strong>' + esc(p.product_name) + '</strong><span>' + esc(p.brand || '-') + '</span></div></div></td>' +
              '<td>' + esc(PL.categoryName(p.category_id)) + '</td>' +
              '<td class="mono">' + PL.money(p.price) + '</td>' +
              '<td>' + p.stock + '</td>' +
              '<td>' + ADM.productStatusPill(p.status) + '</td></tr>';
          }).join('') : emptyRow(5, 'Belum ada produk.')) +
        '</tbody></table></div>' +
      '</section>';
  }

  /* ---------- products ---------- */
  var productFilter = { q: '', category: 'all', status: 'all' };

  function productFormHTML(product) {
    var p = product || {};
    var categories = PL.getCategories();
    var conditions = ['Seperti Baru', 'Sangat Baik', 'Baik', 'Cukup'];
    var image = p.image || '';
    return '' +
      '<form id="productForm" novalidate>' +
        '<div id="formErrors" class="login-error" style="display:none"></div>' +
        '<div class="form-grid">' +
          '<div class="field full"><label>Nama Produk <span class="req">*</span></label>' +
            '<input name="product_name" type="text" value="' + esc(p.product_name || '') + '" placeholder="Contoh: Blush Oversized Blazer"></div>' +
          '<div class="field"><label>Kategori <span class="req">*</span></label>' +
            '<select name="category_id"><option value="">Pilih kategori</option>' +
              categories.map(function (c) {
                return '<option value="' + esc(c.category_id) + '"' + (p.category_id === c.category_id ? ' selected' : '') + '>' +
                  esc(c.icon || '') + ' ' + esc(c.category_name) + '</option>';
              }).join('') + '</select></div>' +
          '<div class="field"><label>Status Produk</label>' +
            '<select name="status"><option value="Aktif"' + (p.status !== 'Nonaktif' ? ' selected' : '') + '>Aktif</option>' +
            '<option value="Nonaktif"' + (p.status === 'Nonaktif' ? ' selected' : '') + '>Nonaktif</option></select></div>' +
          '<div class="field"><label>Harga (Rp) <span class="req">*</span></label>' +
            '<input name="price" type="number" min="1" step="1000" value="' + (p.price != null ? p.price : '') + '" placeholder="185000"></div>' +
          '<div class="field"><label>Harga Sebelum Diskon</label>' +
            '<input name="old_price" type="number" min="0" step="1000" value="' + (p.old_price != null ? p.old_price : '') + '" placeholder="Opsional">' +
            '<span class="hint">Kosongkan jika tidak ada diskon.</span></div>' +
          '<div class="field"><label>Ukuran <span class="req">*</span></label>' +
            '<input name="size" type="text" value="' + esc(p.size || '') + '" placeholder="S / M / L / 42 / All Size"></div>' +
          '<div class="field"><label>Kondisi Barang <span class="req">*</span></label>' +
            '<select name="condition"><option value="">Pilih kondisi</option>' +
              conditions.map(function (c) {
                return '<option value="' + esc(c) + '"' + (p.condition === c ? ' selected' : '') + '>' + esc(c) + '</option>';
              }).join('') + '</select></div>' +
          '<div class="field"><label>Merek</label>' +
            '<input name="brand" type="text" value="' + esc(p.brand || '') + '" placeholder="Zara, H&M, Uniqlo…"></div>' +
          '<div class="field"><label>Stok <span class="req">*</span></label>' +
            '<input name="stock" type="number" min="0" step="1" value="' + (p.stock != null ? p.stock : 1) + '"></div>' +
          '<div class="field full"><label>Deskripsi</label>' +
            '<textarea name="description" placeholder="Jelaskan kondisi barang, bahan, dan catatan pemakaian.">' + esc(p.description || '') + '</textarea></div>' +
          '<div class="field full"><label>Foto Produk</label>' +
            '<div class="upload-row">' +
              '<img class="upload-preview" id="imagePreview" src="' + esc(image || '/assets/img/placeholder.svg') + '" alt="Pratinjau foto">' +
              '<div>' +
                '<input type="file" id="imageInput" accept="image/jpeg,image/png,image/webp" hidden>' +
                '<button class="btn btn-soft btn-sm" type="button" id="pickImage">Pilih Foto</button>' +
                '<div class="hint" style="margin-top:.3rem">JPG/PNG/WEBP, maks 4 MB. Foto otomatis diperkecil.</div>' +
              '</div>' +
            '</div>' +
            '<input type="hidden" name="image" value="' + esc(image) + '"></div>' +
        '</div>' +
        '<div class="form-actions">' +
          '<button class="btn btn-ghost" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit">' + (product ? 'Save Changes' : 'Add Product') + '</button>' +
        '</div>' +
      '</form>';
  }

  function showFormErrors(container, errors) {
    var box = container.querySelector('#formErrors');
    if (!errors || !errors.length) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }
    box.style.display = 'block';
    box.innerHTML = errors.map(function (e) { return '<div>• ' + esc(e) + '</div>'; }).join('');
  }

  function openProductModal(product) {
    var el = ADM.modal({
      title: product ? 'Edit Produk' : 'Tambah Produk Baru',
      subtitle: product ? product.product_id : 'Produk langsung tampil di katalog setelah disimpan',
      body: productFormHTML(product)
    });
    var form = el.querySelector('#productForm');
    var fileInput = el.querySelector('#imageInput');
    var preview = el.querySelector('#imagePreview');
    var hidden = form.querySelector('[name="image"]');

    el.querySelector('#pickImage').addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function () {
      var file = fileInput.files[0];
      if (!file) return;
      ADM.resizeImage(file).then(function (dataUrl) {
        hidden.value = dataUrl;
        preview.src = dataUrl;
        toast('Foto berhasil dimuat.', 'success');
      }).catch(function (err) {
        toast(err.message, 'error');
        fileInput.value = '';
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        product_id: product ? product.product_id : null,
        product_name: form.product_name.value,
        category_id: form.category_id.value,
        price: form.price.value,
        old_price: form.old_price.value,
        size: form.size.value,
        condition: form.condition.value,
        brand: form.brand.value,
        description: form.description.value,
        image: hidden.value,
        stock: form.stock.value,
        status: form.status.value
      };
      var res = PL.saveProduct(data);
      showFormErrors(el, res.errors);
      if (!res.ok) {
        toast(res.message, 'error');
        return;
      }
      ADM.closeModal();
      toast(res.message, 'success');
      products();
    });
  }

  function openDeleteProduct(product) {
    ADM.confirmDialog({
      title: 'Hapus produk?',
      message: '"' + product.product_name + '" akan dihapus permanen dari katalog, keranjang, dan wishlist pengguna.',
      confirmLabel: 'Delete',
      onConfirm: function () {
        var res = PL.deleteProduct(product.product_id);
        toast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) products();
      }
    });
  }

  function products() {
    ADM.setHeader('Products', 'Kelola seluruh produk PINKLOOP');
    var categories = PL.getCategories();
    var list = PL.getProducts({ includeInactive: true });

    root.innerHTML = '' +
      '<section class="panel">' +
        '<div class="toolbar">' +
          '<div class="search-input grow"><span class="muted">⌕</span>' +
            '<input type="search" id="productSearch" placeholder="Cari nama produk atau merek…" value="' + esc(productFilter.q) + '"></div>' +
          '<select class="control" id="filterCategory">' +
            '<option value="all">Semua kategori</option>' +
            categories.map(function (c) {
              return '<option value="' + esc(c.category_id) + '"' + (productFilter.category === c.category_id ? ' selected' : '') + '>' + esc(c.category_name) + '</option>';
            }).join('') +
          '</select>' +
          '<select class="control" id="filterStatus">' +
            '<option value="all"' + (productFilter.status === 'all' ? ' selected' : '') + '>Semua status</option>' +
            '<option value="Aktif"' + (productFilter.status === 'Aktif' ? ' selected' : '') + '>Aktif</option>' +
            '<option value="Nonaktif"' + (productFilter.status === 'Nonaktif' ? ' selected' : '') + '>Nonaktif</option>' +
          '</select>' +
          '<button class="btn btn-primary" id="addProduct">+ Add Product</button>' +
        '</div>' +
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Produk</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th style="text-align:right">Aksi</th>' +
        '</tr></thead><tbody id="productRows"></tbody></table></div>' +
        '<div class="small muted" id="productCount" style="margin-top:.7rem"></div>' +
      '</section>';

    function paint() {
      var filtered = list.filter(function (p) {
        if (productFilter.category !== 'all' && p.category_id !== productFilter.category) return false;
        if (productFilter.status !== 'all' && p.status !== productFilter.status) return false;
        if (productFilter.q) {
          var hay = (p.product_name + ' ' + (p.brand || '') + ' ' + p.product_id).toLowerCase();
          if (hay.indexOf(productFilter.q.toLowerCase()) === -1) return false;
        }
        return true;
      });

      document.getElementById('productRows').innerHTML = filtered.length ? filtered.map(function (p) {
        return '<tr>' +
          '<td><div class="cell-product"><img class="thumb" src="' + esc(p.image || '/assets/img/placeholder.svg') + '" alt="" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
            '<div><strong>' + esc(p.product_name) + '</strong><span>' + esc(p.brand || 'Tanpa merek') + ' · ' + esc(p.size) + '</span></div></div></td>' +
          '<td>' + esc(PL.categoryName(p.category_id)) + '</td>' +
          '<td class="mono">' + PL.money(p.price) + '<div class="small muted">' + esc(p.condition) + '</div></td>' +
          '<td>' + p.stock + '</td>' +
          '<td>' + ADM.productStatusPill(p.status) + '</td>' +
          '<td><div class="actions">' +
            '<button class="icon-act" data-edit="' + esc(p.product_id) + '" title="Edit">✏️</button>' +
            '<button class="icon-act" data-toggle="' + esc(p.product_id) + '" title="' + (p.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan') + '">' + (p.status === 'Aktif' ? '🚫' : '✅') + '</button>' +
            '<button class="icon-act danger" data-delete="' + esc(p.product_id) + '" title="Hapus">🗑️</button>' +
          '</div></td></tr>';
      }).join('') : emptyRow(6, 'Tidak ada produk yang cocok.');

      document.getElementById('productCount').textContent = filtered.length + ' dari ' + list.length + ' produk ditampilkan';
    }

    paint();

    document.getElementById('productSearch').addEventListener('input', function (e) {
      productFilter.q = e.target.value.trim();
      paint();
    });
    document.getElementById('filterCategory').addEventListener('change', function (e) {
      productFilter.category = e.target.value;
      paint();
    });
    document.getElementById('filterStatus').addEventListener('change', function (e) {
      productFilter.status = e.target.value;
      paint();
    });
    document.getElementById('addProduct').addEventListener('click', function () { openProductModal(null); });

    document.getElementById('productRows').addEventListener('click', function (e) {
      var edit = e.target.closest('[data-edit]');
      var toggle = e.target.closest('[data-toggle]');
      var del = e.target.closest('[data-delete]');
      var id = (edit || toggle || del) && (edit || toggle || del).getAttribute(edit ? 'data-edit' : toggle ? 'data-toggle' : 'data-delete');
      var product = id && list.find(function (p) { return p.product_id === id; });
      if (!product) return;
      if (edit) return openProductModal(product);
      if (toggle) {
        var res = PL.toggleProductStatus(id);
        toast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) products();
        return;
      }
      if (del) openDeleteProduct(product);
    });
  }

  /* ---------- categories ---------- */
  function openCategoryModal(category) {
    var c = category || {};
    var el = ADM.modal({
      title: category ? 'Edit Kategori' : 'Tambah Kategori',
      subtitle: category ? category.category_id : 'Kategori baru langsung tersedia di form produk',
      size: 'narrow',
      body: '<form id="categoryForm" novalidate>' +
        '<div class="form-grid">' +
          '<div class="field"><label>Nama Kategori <span class="req">*</span></label>' +
            '<input name="category_name" type="text" value="' + esc(c.category_name || '') + '" placeholder="Contoh: Sepatu"></div>' +
          '<div class="field"><label>Ikon Kategori</label>' +
            '<input name="icon" type="text" value="' + esc(c.icon || '') + '" placeholder="Emoji, mis. 👟" maxlength="4">' +
            '<span class="hint">Gunakan satu emoji sebagai ikon.</span></div>' +
        '</div>' +
        '<div class="form-actions">' +
          '<button class="btn btn-ghost" type="button" data-modal-close>Cancel</button>' +
          '<button class="btn btn-primary" type="submit">' + (category ? 'Save Changes' : 'Add Category') + '</button>' +
        '</div></form>'
    });
    el.querySelector('#categoryForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var res = PL.saveCategory({
        category_id: category ? category.category_id : null,
        category_name: el.querySelector('[name="category_name"]').value,
        icon: el.querySelector('[name="icon"]').value
      });
      if (!res.ok) return toast(res.message, 'error');
      ADM.closeModal();
      toast(res.message, 'success');
      categories();
    });
  }

  function categories() {
    ADM.setHeader('Categories', 'Atur kategori yang tampil di katalog');
    var list = PL.getCategories();

    root.innerHTML = '' +
      '<section class="panel">' +
        '<div class="panel-head"><div><h2>Daftar Kategori</h2><p>' + list.length + ' kategori aktif di katalog</p></div>' +
          '<button class="btn btn-primary" id="addCategory">+ Tambah Kategori</button></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Ikon</th><th>Nama Kategori</th><th>Jumlah Produk</th><th style="text-align:right">Aksi</th>' +
        '</tr></thead><tbody id="categoryRows">' + (list.length ? list.map(function (c) {
          var count = PL.categoryProductCount(c.category_id);
          return '<tr>' +
            '<td style="font-size:1.3rem">' + esc(c.icon || '🏷️') + '</td>' +
            '<td><strong>' + esc(c.category_name) + '</strong><div class="small muted">' + esc(c.category_id) + '</div></td>' +
            '<td>' + count + ' produk</td>' +
            '<td><div class="actions">' +
              '<button class="icon-act" data-edit-cat="' + esc(c.category_id) + '" title="Edit">✏️</button>' +
              '<button class="icon-act danger" data-del-cat="' + esc(c.category_id) + '" title="Hapus">🗑️</button>' +
            '</div></td></tr>';
        }).join('') : emptyRow(4, 'Belum ada kategori.')) +
        '</tbody></table></div>' +
      '</section>';

    document.getElementById('addCategory').addEventListener('click', function () { openCategoryModal(null); });

    document.getElementById('categoryRows').addEventListener('click', function (e) {
      var edit = e.target.closest('[data-edit-cat]');
      var del = e.target.closest('[data-del-cat]');
      if (edit) {
        var cat = list.find(function (c) { return c.category_id === edit.getAttribute('data-edit-cat'); });
        if (cat) openCategoryModal(cat);
      }
      if (del) {
        var target = list.find(function (c) { return c.category_id === del.getAttribute('data-del-cat'); });
        if (!target) return;
        ADM.confirmDialog({
          title: 'Hapus kategori?',
          message: 'Kategori "' + target.category_name + '" akan dihapus. Kategori yang masih dipakai produk tidak dapat dihapus.',
          confirmLabel: 'Delete',
          onConfirm: function () {
            var res = PL.deleteCategory(target.category_id);
            toast(res.message, res.ok ? 'success' : 'error');
            if (res.ok) categories();
          }
        });
      }
    });
  }

  /* ---------- orders ---------- */
  var orderFilter = { q: '', status: 'all' };

  function openOrderDetail(order) {
    var rows = order.items.map(function (it) {
      return '<div class="order-line">' +
        '<img src="' + esc(it.image || '/assets/img/placeholder.svg') + '" alt="" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
        '<div><div class="nm">' + esc(it.product_name) + '</div>' +
        '<div class="qt">Ukuran ' + esc(it.size) + ' · ' + it.quantity + ' × ' + PL.money(it.price) + '</div></div>' +
        '<strong class="small">' + PL.money(it.price * it.quantity) + '</strong></div>';
    }).join('');

    var el = ADM.modal({
      title: 'Detail Pesanan ' + order.order_id,
      subtitle: PL.formatDateTime(order.order_date),
      body: '' +
        '<div class="grid-2-even">' +
          '<div>' +
            '<div class="section-title">Informasi Pembeli</div>' +
            '<div class="detail-list">' +
              '<div class="detail-row"><span>Nama</span><strong>' + esc(order.customer_name) + '</strong></div>' +
              '<div class="detail-row"><span>WhatsApp</span><strong>' + esc(order.phone) + '</strong></div>' +
              '<div class="detail-row"><span>Email</span><strong>' + esc(order.email || '-') + '</strong></div>' +
              '<div class="detail-row"><span>Customer ID</span><strong>' + esc(order.customer_id) + '</strong></div>' +
            '</div>' +
            '<div class="section-title" style="margin-top:1.2rem">Alamat Pengiriman</div>' +
            '<p class="small" style="margin:0">' + esc(order.shipping_address) + '<br>' +
              esc(order.city) + ', ' + esc(order.postal_code) + '<br>' +
              '<span class="muted">' + esc(order.shipping_method) + '</span></p>' +
            (order.note ? '<div class="small muted" style="margin-top:.6rem">Catatan: ' + esc(order.note) + '</div>' : '') +
          '</div>' +
          '<div>' +
            '<div class="section-title">Rincian Produk</div>' + rows +
            '<div class="detail-list" style="margin-top:.8rem">' +
              '<div class="detail-row"><span>Subtotal</span><strong>' + PL.money(order.subtotal) + '</strong></div>' +
              '<div class="detail-row"><span>Ongkir</span><strong>' + PL.money(order.shipping_cost) + '</strong></div>' +
              '<div class="detail-row"><span>Metode bayar</span><strong>' + esc(order.payment_method) + '</strong></div>' +
              '<div class="detail-row"><span>Total</span><strong>' + PL.money(order.total_price) + '</strong></div>' +
            '</div>' +
            '<div class="section-title" style="margin-top:1.2rem">Status Pesanan</div>' +
            '<div class="field"><select id="orderStatusSelect">' +
              PL.STATUSES.map(function (s) {
                return '<option value="' + esc(s) + '"' + (order.order_status === s ? ' selected' : '') + '>' + esc(s) + '</option>';
              }).join('') +
            '</select></div>' +
            '<div class="form-actions" style="margin-top:.9rem">' +
              '<button class="btn btn-ghost" type="button" data-modal-close>Tutup</button>' +
              '<button class="btn btn-primary" type="button" id="saveStatus">Save Changes</button>' +
            '</div>' +
          '</div>' +
        '</div>'
    });

    el.querySelector('#saveStatus').addEventListener('click', function () {
      var next = el.querySelector('#orderStatusSelect').value;
      var res = PL.updateOrderStatus(order.order_id, next);
      toast(res.message, res.ok ? 'success' : 'error');
      if (res.ok) {
        ADM.closeModal();
        orders();
      }
    });
  }

  function orders() {
    ADM.setHeader('Orders', 'Semua pesanan yang masuk dari pengguna');
    var list = PL.getOrders();

    root.innerHTML = '' +
      '<section class="panel">' +
        '<div class="toolbar">' +
          '<div class="search-input grow"><span class="muted">⌕</span>' +
            '<input type="search" id="orderSearch" placeholder="Cari Order ID, nama, atau nomor WhatsApp…" value="' + esc(orderFilter.q) + '"></div>' +
          '<select class="control" id="orderStatusFilter">' +
            '<option value="all">Semua status</option>' +
            PL.STATUSES.map(function (s) {
              return '<option value="' + esc(s) + '"' + (orderFilter.status === s ? ' selected' : '') + '>' + esc(s) + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>Order ID</th><th>Nama Pembeli</th><th>Tanggal</th><th>Produk</th><th>Total</th><th>Pembayaran</th><th>Status</th><th style="text-align:right">Action</th>' +
        '</tr></thead><tbody id="orderRows"></tbody></table></div>' +
        '<div class="small muted" id="orderCount" style="margin-top:.7rem"></div>' +
      '</section>';

    function paint() {
      var filtered = list.filter(function (o) {
        if (orderFilter.status !== 'all' && o.order_status !== orderFilter.status) return false;
        if (orderFilter.q) {
          var hay = (o.order_id + ' ' + o.customer_name + ' ' + o.phone).toLowerCase();
          if (hay.indexOf(orderFilter.q.toLowerCase()) === -1) return false;
        }
        return true;
      });

      document.getElementById('orderRows').innerHTML = filtered.length ? filtered.map(function (o) {
        var qty = o.items.reduce(function (s, it) { return s + it.quantity; }, 0);
        return '<tr>' +
          '<td><strong>' + esc(o.order_id) + '</strong></td>' +
          '<td>' + esc(o.customer_name) + '<div class="small muted">' + esc(o.phone) + '</div></td>' +
          '<td>' + PL.formatDate(o.order_date) + '</td>' +
          '<td>' + qty + ' item</td>' +
          '<td class="mono">' + PL.money(o.total_price) + '</td>' +
          '<td class="small">' + esc(o.payment_method) + '</td>' +
          '<td>' + ADM.statusPill(o.order_status) + '</td>' +
          '<td><div class="actions"><button class="icon-act" data-detail="' + esc(o.order_id) + '" title="Lihat detail">👁️</button></div></td>' +
        '</tr>';
      }).join('') : emptyRow(8, 'Tidak ada pesanan yang cocok.');

      document.getElementById('orderCount').textContent = filtered.length + ' dari ' + list.length + ' pesanan';
    }

    paint();

    document.getElementById('orderSearch').addEventListener('input', function (e) {
      orderFilter.q = e.target.value.trim();
      paint();
    });
    document.getElementById('orderStatusFilter').addEventListener('change', function (e) {
      orderFilter.status = e.target.value;
      paint();
    });
    document.getElementById('orderRows').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-detail]');
      if (!btn) return;
      var order = list.find(function (o) { return o.order_id === btn.getAttribute('data-detail'); });
      if (order) openOrderDetail(order);
    });
  }

  /* ---------- customers ---------- */
  function openCustomerDetail(customer) {
    var orders = PL.getOrders().filter(function (o) { return o.customer_id === customer.customer_id; });
    var list = orders.length ? orders.map(function (o) {
      return '<div class="detail-row"><span>' + esc(o.order_id) + ' · ' + PL.formatDate(o.order_date) + '</span>' +
        '<strong>' + PL.money(o.total_price) + ' ' + ADM.statusPill(o.order_status) + '</strong></div>';
    }).join('') : '<p class="small muted">Belum ada transaksi.</p>';

    ADM.modal({
      title: customer.name,
      subtitle: customer.customer_id + ' · terdaftar ' + PL.formatDate(customer.created_at),
      body: '' +
        '<div class="detail-list">' +
          '<div class="detail-row"><span>Email</span><strong>' + esc(customer.email || '-') + '</strong></div>' +
          '<div class="detail-row"><span>Nomor telepon</span><strong>' + esc(customer.phone) + '</strong></div>' +
          '<div class="detail-row"><span>Alamat</span><strong>' + esc(customer.address || '-') + '</strong></div>' +
          '<div class="detail-row"><span>Kota / Kode pos</span><strong>' + esc(customer.city || '-') + ' ' + esc(customer.postal_code || '') + '</strong></div>' +
          '<div class="detail-row"><span>Jumlah transaksi</span><strong>' + customer.transactions + '</strong></div>' +
          '<div class="detail-row"><span>Total belanja</span><strong>' + PL.money(customer.spent) + '</strong></div>' +
          '<div class="detail-row"><span>Status akun</span><strong>' + (customer.status === 'Aktif'
            ? '<span class="pill pill-green">Aktif</span>' : '<span class="pill pill-gray">Nonaktif</span>') + '</strong></div>' +
        '</div>' +
        '<div class="section-title" style="margin-top:1.2rem">Riwayat pesanan</div>' +
        '<div class="detail-list">' + list + '</div>' +
        '<div class="form-actions">' +
          '<button class="btn btn-ghost" type="button" data-modal-close>Tutup</button>' +
          '<button class="btn ' + (customer.status === 'Aktif' ? 'btn-danger' : 'btn-primary') + '" type="button" id="toggleCustomer">' +
            (customer.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun') + '</button>' +
        '</div>'
    }).querySelector('#toggleCustomer').addEventListener('click', function () {
      var next = customer.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
      var res = PL.updateCustomer(customer.customer_id, { status: next });
      toast(res.ok ? 'Status akun diubah menjadi ' + next + '.' : res.message, res.ok ? 'success' : 'error');
      if (res.ok) {
        ADM.closeModal();
        customers();
      }
    });
  }

  function customers() {
    ADM.setHeader('Customers', 'Data pelanggan yang terdaftar di PINKLOOP');
    var list = PL.getCustomers();

    root.innerHTML = '' +
      '<section class="panel">' +
        '<div class="panel-head"><div><h2>Daftar Pelanggan</h2><p>' + list.length + ' pelanggan terdaftar</p></div></div>' +
        '<div class="table-wrap"><table class="data"><thead><tr>' +
          '<th>ID Customer</th><th>Nama</th><th>Email</th><th>Telepon</th><th>Registrasi</th><th>Transaksi</th><th>Status</th><th style="text-align:right">Aksi</th>' +
        '</tr></thead><tbody id="customerRows">' + (list.length ? list.map(function (c) {
          return '<tr>' +
            '<td><strong>' + esc(c.customer_id) + '</strong></td>' +
            '<td>' + esc(c.name) + '</td>' +
            '<td class="small">' + esc(c.email || '-') + '</td>' +
            '<td class="small">' + esc(c.phone) + '</td>' +
            '<td class="small">' + PL.formatDate(c.created_at) + '</td>' +
            '<td>' + c.transactions + ' <span class="small muted">· ' + PL.shortMoney(c.spent) + '</span></td>' +
            '<td>' + (c.status === 'Aktif' ? '<span class="pill pill-green">Aktif</span>' : '<span class="pill pill-gray">Nonaktif</span>') + '</td>' +
            '<td><div class="actions"><button class="icon-act" data-customer="' + esc(c.customer_id) + '" title="Detail">👁️</button></div></td>' +
          '</tr>';
        }).join('') : emptyRow(8, 'Belum ada pelanggan.')) +
        '</tbody></table></div>' +
      '</section>';

    document.getElementById('customerRows').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-customer]');
      if (!btn) return;
      var target = list.find(function (c) { return c.customer_id === btn.getAttribute('data-customer'); });
      if (target) openCustomerDetail(target);
    });
  }

  /* ---------- reports ---------- */
  var reportState = { period: '30', group: 'daily' };

  function buildSeries(orders, group) {
    var buckets = {};
    orders.forEach(function (o) {
      var d = new Date(o.order_date);
      var key, label;
      if (group === 'monthly') {
        key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      } else if (group === 'weekly') {
        var ws = weekStart(d);
        key = PL.dateKey(ws);
        label = 'Mgg ' + dayLabel(ws);
      } else {
        key = PL.dateKey(d);
        label = dayLabel(d);
      }
      if (!buckets[key]) buckets[key] = { label: label, value: 0, orders: 0 };
      buckets[key].value += o.total_price;
      buckets[key].orders += 1;
    });
    var keys = Object.keys(buckets).sort();
    if (keys.length > 12) keys = keys.slice(keys.length - 12);
    return keys.map(function (k) {
      return { label: buckets[k].label, value: buckets[k].value, sortKey: k };
    });
  }

  function reports() {
    ADM.setHeader('Reports & Analytics', 'Laporan dihitung dari transaksi tersimpan');
    var allOrders = PL.getOrders();
    var valid = validOrders(allOrders);
    var filtered = withinPeriod(valid, reportState.period);
    var revenue = filtered.reduce(function (s, o) { return s + o.total_price; }, 0);
    var units = unitsOf(filtered);
    var avg = filtered.length ? revenue / filtered.length : 0;

    var bestSellers = {};
    filtered.forEach(function (o) {
      o.items.forEach(function (it) {
        if (!bestSellers[it.product_id]) {
          bestSellers[it.product_id] = { name: it.product_name, image: it.image, qty: 0, revenue: 0 };
        }
        bestSellers[it.product_id].qty += it.quantity;
        bestSellers[it.product_id].revenue += it.quantity * it.price;
      });
    });
    var topProducts = Object.keys(bestSellers).map(function (k) {
      return Object.assign({ product_id: k }, bestSellers[k]);
    }).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

    var catTotals = {};
    filtered.forEach(function (o) {
      o.items.forEach(function (it) {
        var product = PL.getProduct(it.product_id);
        var catId = product ? product.category_id : 'CAT-?';
        if (!catTotals[catId]) catTotals[catId] = { qty: 0, revenue: 0 };
        catTotals[catId].qty += it.quantity;
        catTotals[catId].revenue += it.quantity * it.price;
      });
    });
    var catRows = Object.keys(catTotals).map(function (id) {
      return { name: PL.categoryName(id), qty: catTotals[id].qty, revenue: catTotals[id].revenue };
    }).sort(function (a, b) { return b.qty - a.qty; });
    var catMax = Math.max.apply(null, catRows.map(function (r) { return r.qty; }).concat([1]));

    var series = buildSeries(filtered, reportState.group);
    var chart = series.length
      ? ADM.lineChart(series, {
        id: 'report',
        color: reportState.group === 'monthly' ? '#B79BE6' : '#E85D9B',
        height: 240,
        formatY: function (v) { return v >= 1000 ? Math.round(v / 1000) + 'rb' : Math.round(v); }
      })
      : '<div class="chart-empty">Belum ada transaksi pada periode ini.</div>';

    var periodOptions = [
      { v: 'today', l: 'Hari ini' },
      { v: '7', l: '7 hari terakhir' },
      { v: '30', l: '30 hari terakhir' },
      { v: 'month', l: 'Bulan ini' },
      { v: 'all', l: 'Semua periode' }
    ];

    root.innerHTML = '' +
      '<section class="panel">' +
        '<div class="toolbar">' +
          '<div><div class="section-title" style="margin:0 0 .3rem">Periode</div>' +
            '<select class="control" id="reportPeriod">' +
              periodOptions.map(function (p) {
                return '<option value="' + p.v + '"' + (reportState.period === p.v ? ' selected' : '') + '>' + p.l + '</option>';
              }).join('') +
            '</select></div>' +
          '<div style="margin-left:auto"><div class="section-title" style="margin:0 0 .3rem">Grafik</div>' +
            '<select class="control" id="reportGroup">' +
              '<option value="daily"' + (reportState.group === 'daily' ? ' selected' : '') + '>Harian</option>' +
              '<option value="weekly"' + (reportState.group === 'weekly' ? ' selected' : '') + '>Mingguan</option>' +
              '<option value="monthly"' + (reportState.group === 'monthly' ? ' selected' : '') + '>Bulanan</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="stat-grid" style="margin-bottom:1.1rem">' +
          '<div class="stat-card"><div class="stat-ico">💰</div><div>' +
            '<div class="stat-label">Total Penjualan</div><div class="stat-value">' + PL.shortMoney(revenue) + '</div>' +
            '<div class="stat-note">' + PL.money(revenue) + '</div></div></div>' +
          '<div class="stat-card"><div class="stat-ico">🧾</div><div>' +
            '<div class="stat-label">Jumlah Transaksi</div><div class="stat-value">' + filtered.length + '</div>' +
            '<div class="stat-note">' + units + ' item terjual</div></div></div>' +
          '<div class="stat-card"><div class="stat-ico">📊</div><div>' +
            '<div class="stat-label">Rata-rata Order</div><div class="stat-value">' + PL.shortMoney(avg) + '</div>' +
            '<div class="stat-note">per transaksi</div></div></div>' +
          '<div class="stat-card"><div class="stat-ico">👥</div><div>' +
            '<div class="stat-label">Pelanggan</div><div class="stat-value">' + PL.getCustomers().length + '</div>' +
            '<div class="stat-note">terdaftar</div></div></div>' +
        '</div>' +
        '<div class="panel-head" style="margin-bottom:.4rem"><div><h2>Pendapatan berdasarkan periode</h2>' +
          '<p>Menampilkan maksimal 12 titik data terakhir</p></div></div>' +
        chart +
        '<div class="chart-legend"><span><span class="dot" style="background:' + (reportState.group === 'monthly' ? '#B79BE6' : '#E85D9B') + '"></span>Pendapatan</span></div>' +
      '</section>' +

      '<section class="grid-2">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Produk paling laris</h2><p>Berdasarkan unit terjual pada periode</p></div></div>' +
          '<div class="table-wrap"><table class="data"><thead><tr><th>#</th><th>Produk</th><th>Terjual</th><th>Pendapatan</th></tr></thead><tbody>' +
          (topProducts.length ? topProducts.map(function (p, i) {
            return '<tr><td>' + (i + 1) + '</td>' +
              '<td><div class="cell-product"><img class="thumb" src="' + esc(p.image || '/assets/img/placeholder.svg') + '" alt="" onerror="this.src=\'/assets/img/placeholder.svg\'">' +
              '<div><strong>' + esc(p.name) + '</strong><span>' + esc(p.product_id) + '</span></div></div></td>' +
              '<td>' + p.qty + '</td><td class="mono">' + PL.money(p.revenue) + '</td></tr>';
          }).join('') : emptyRow(4, 'Belum ada penjualan pada periode ini.')) +
          '</tbody></table></div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Kategori paling populer</h2><p>Proporsi unit terjual</p></div></div>' +
          (catRows.length ? '<div class="bar-list">' + catRows.map(function (r) {
            return '<div class="bar-item">' +
              '<div class="bar-top"><span>' + esc(r.name) + '</span><span class="muted">' + r.qty + ' item · ' + PL.shortMoney(r.revenue) + '</span></div>' +
              '<div class="bar-track"><div class="bar-fill" style="width:' + Math.max(6, Math.round(r.qty / catMax * 100)) + '%"></div></div>' +
            '</div>';
          }).join('') + '</div>' : '<div class="empty-state">Belum ada data kategori.</div>') +
        '</div>' +
      '</section>';

    document.getElementById('reportPeriod').addEventListener('change', function (e) {
      reportState.period = e.target.value;
      reports();
    });
    document.getElementById('reportGroup').addEventListener('change', function (e) {
      reportState.group = e.target.value;
      reports();
    });
  }

  /* ---------- settings ---------- */
  function settings() {
    ADM.setHeader('Settings', 'Informasi toko dan keamanan akun admin');
    var s = PL.getSettings();
    var admin = PL.currentAdmin();

    root.innerHTML = '' +
      '<section class="grid-2-even">' +
        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Informasi Toko</h2><p>Tampil di header, footer, dan halaman toko</p></div></div>' +
          '<form id="storeForm" novalidate>' +
            '<div id="storeErrors" class="login-error" style="display:none"></div>' +
            '<div class="form-grid">' +
              '<div class="field"><label>Nama Toko <span class="req">*</span></label>' +
                '<input name="store_name" type="text" value="' + esc(s.store_name || '') + '"></div>' +
              '<div class="field"><label>Tagline</label>' +
                '<input name="tagline" type="text" value="' + esc(s.tagline || '') + '"></div>' +
              '<div class="field"><label>Email Toko</label>' +
                '<input name="email" type="email" value="' + esc(s.email || '') + '"></div>' +
              '<div class="field"><label>Nomor WhatsApp</label>' +
                '<input name="whatsapp" type="text" value="' + esc(s.whatsapp || '') + '"></div>' +
              '<div class="field full"><label>Deskripsi Toko</label>' +
                '<textarea name="description">' + esc(s.description || '') + '</textarea></div>' +
              '<div class="field full"><label>Logo Toko</label>' +
                '<div class="upload-row">' +
                  '<img class="upload-preview" id="logoPreview" src="' + esc(s.logo || '/assets/img/placeholder.svg') + '" alt="Logo">' +
                  '<div><input type="file" id="logoInput" accept="image/png,image/jpeg,image/webp" hidden>' +
                    '<button class="btn btn-soft btn-sm" type="button" id="pickLogo">Pilih Logo</button>' +
                    '<div class="hint" style="margin-top:.3rem">PNG/JPG/WEBP. Kosongkan untuk logo bawaan.</div></div>' +
                '</div>' +
                '<input type="hidden" name="logo" value="' + esc(s.logo || '') + '"></div>' +
            '</div>' +
            '<div class="form-actions"><button class="btn btn-primary" type="submit">Save Changes</button></div>' +
          '</form>' +
        '</div>' +

        '<div class="panel">' +
          '<div class="panel-head"><div><h2>Akun Admin</h2><p>Username dan penggantian password</p></div></div>' +
          '<form id="adminForm" novalidate>' +
            '<div id="adminErrors" class="login-error" style="display:none"></div>' +
            '<div class="form-grid">' +
              '<div class="field full"><label>Username Admin <span class="req">*</span></label>' +
                '<input name="username" type="text" value="' + esc(admin.username) + '" autocomplete="username"></div>' +
              '<div class="field full"><label>Password Saat Ini <span class="req">*</span></label>' +
                '<input name="current_password" type="password" placeholder="Wajib untuk menyimpan perubahan" autocomplete="current-password"></div>' +
              '<div class="field"><label>Password Baru</label>' +
                '<input name="new_password" type="password" placeholder="Kosongkan bila tidak diganti" autocomplete="new-password">' +
                '<span class="hint">Minimal 6 karakter.</span></div>' +
              '<div class="field"><label>Konfirmasi Password Baru</label>' +
                '<input name="confirm_password" type="password" placeholder="Ulangi password baru" autocomplete="new-password"></div>' +
            '</div>' +
            '<div class="form-actions"><button class="btn btn-primary" type="submit">Save Changes</button></div>' +
            '<div class="sidebar-foot" style="margin-top:1.2rem">Password disimpan sebagai hash SHA-256, bukan teks biasa. Untuk produksi, autentikasi tetap harus divalidasi di server.</div>' +
          '</form>' +
        '</div>' +
      '</section>' +

      '<section class="panel">' +
        '<div class="panel-head"><div><h2>Informasi Sistem</h2><p>Status penyimpanan data prototype</p></div></div>' +
        '<div class="grid-3">' +
          '<div><div class="section-title">Penyimpanan</div><strong class="small">Browser localStorage</strong>' +
            '<div class="small muted">Produk, kategori, pesanan, pelanggan, keranjang, dan wishlist tersimpan setelah halaman di-refresh.</div></div>' +
          '<div><div class="section-title">Total data</div><strong class="small">' +
            PL.getProducts({ includeInactive: true }).length + ' produk · ' + PL.getCategories().length + ' kategori</strong>' +
            '<div class="small muted">' + PL.getOrders().length + ' pesanan · ' + PL.getCustomers().length + ' pelanggan</div></div>' +
          '<div><div class="section-title">Sesi login</div><strong class="small">Aktif hingga 8 jam</strong>' +
            '<div class="small muted">Login: ' + PL.formatDateTime(admin.login_at) + '</div></div>' +
        '</div>' +
      '</section>';

    var storeForm = document.getElementById('storeForm');
    var logoInput = document.getElementById('logoInput');
    document.getElementById('pickLogo').addEventListener('click', function () { logoInput.click(); });
    logoInput.addEventListener('change', function () {
      var file = logoInput.files[0];
      if (!file) return;
      ADM.resizeImage(file, 240, 0.9).then(function (dataUrl) {
        storeForm.logo.value = dataUrl;
        document.getElementById('logoPreview').src = dataUrl;
        toast('Logo berhasil dimuat.', 'success');
      }).catch(function (err) { toast(err.message, 'error'); });
    });

    storeForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = storeForm.store_name.value.trim();
      var errBox = document.getElementById('storeErrors');
      if (!name) {
        errBox.style.display = 'block';
        errBox.textContent = 'Nama toko wajib diisi.';
        return;
      }
      if (storeForm.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeForm.email.value)) {
        errBox.style.display = 'block';
        errBox.textContent = 'Format email toko tidak valid.';
        return;
      }
      errBox.style.display = 'none';
      var res = PL.saveSettings({
        store_name: name,
        tagline: storeForm.tagline.value.trim(),
        email: storeForm.email.value.trim(),
        whatsapp: storeForm.whatsapp.value.trim(),
        description: storeForm.description.value.trim(),
        logo: storeForm.logo.value
      });
      toast(res.message, 'success');
      document.getElementById('sidebarStoreName').textContent = name;
    });

    var adminForm = document.getElementById('adminForm');
    adminForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var errBox = document.getElementById('adminErrors');
      errBox.style.display = 'none';
      PL.updateAdmin({
        username: adminForm.username.value,
        current_password: adminForm.current_password.value,
        new_password: adminForm.new_password.value,
        confirm_password: adminForm.confirm_password.value
      }).then(function (res) {
        if (!res.ok) {
          errBox.style.display = 'block';
          errBox.textContent = res.message;
          return;
        }
        toast(res.message, 'success');
        adminForm.current_password.value = '';
        adminForm.new_password.value = '';
        adminForm.confirm_password.value = '';
        var current = PL.currentAdmin();
        if (current) {
          document.getElementById('profileName').textContent = current.username;
          document.getElementById('profileAvatar').textContent = current.username.charAt(0);
        }
      });
    });
  }

  /* ---------- router ---------- */
  var views = {
    dashboard: dashboard,
    products: products,
    categories: categories,
    orders: orders,
    customers: customers,
    reports: reports,
    settings: settings
  };

  function route() {
    if (!PL.isAdmin()) {
      location.replace('/admin/login/');
      return;
    }
    PL.refreshSession();
    var key = (location.hash || '#dashboard').replace('#', '');
    if (!views[key]) key = 'dashboard';
    document.querySelectorAll('.sidebar-nav a[data-view]').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-view') === key);
    });
    ADM.closeModal();
    views[key]();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('hashchange', route);
  route();
})();
