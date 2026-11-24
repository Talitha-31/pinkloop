/* PINKLOOP – Data layer
 * Satu sumber data (localStorage) untuk halaman pengguna & dashboard admin.
 * Struktur mengikuti tabel: admins, products, categories, customers,
 * orders (dengan detail item), wishlist, cart, settings.
 */
(function (global) {
  'use strict';

  var DB_KEY = 'pinkloop_db_v1';
  var SESSION_KEY = 'pinkloop_admin_session';
  var SESSION_TTL = 8 * 60 * 60 * 1000; // 8 jam
  var ADMIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // sha256("admin")

  var STATUSES = ['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan'];
  var SHIPPING = { 'Reguler (2-4 hari)': 15000, 'Express (1-2 hari)': 25000, 'Ambil di Toko': 0 };
  var PAYMENTS = ['Transfer Bank', 'QRIS', 'E-Wallet', 'COD (Bayar di Tempat)'];

  /* ---------- helpers ---------- */
  function pad(n, len) { return String(n).padStart(len, '0'); }
  function daysAgo(days, hour) {
    var d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour == null ? 10 : hour, 12, 0, 0);
    return d.toISOString();
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  /* ---------- seed ---------- */
  function seed() {
    var categories = [
      { category_id: 'CAT-1', category_name: 'Wanita', icon: '👗' },
      { category_id: 'CAT-2', category_name: 'Pria', icon: '👔' },
      { category_id: 'CAT-3', category_name: 'Anak-anak', icon: '🧸' },
      { category_id: 'CAT-4', category_name: 'Remaja', icon: '🎧' },
      { category_id: 'CAT-5', category_name: 'Tas & Aksesori', icon: '👜' }
    ];

    var products = [
      { product_id: 'PRD-1001', product_name: 'Blush Oversized Blazer', category_id: 'CAT-1', price: 185000, old_price: 320000, size: 'M', condition: 'Sangat Baik', brand: 'Zara', description: 'Blazer oversized warna blush pink dengan bahan wol blend yang lembut. Hanya dipakai dua kali, tidak ada cacat, kancing lengkap, dan sudah dicuci bersih sebelum dikirim.', image: '/assets/img/blazer.svg', stock: 3, status: 'Aktif', created_at: daysAgo(1, 9) },
      { product_id: 'PRD-1002', product_name: 'Vintage Floral Midi Dress', category_id: 'CAT-1', price: 149000, old_price: 275000, size: 'S', condition: 'Seperti Baru', brand: 'H&M', description: 'Dress midi motif bunga pastel dengan potongan flowy dan tali pinggang senada. Bahan viscose adem, cocok untuk acara siang maupun sore. Nyaris tanpa tanda pemakaian.', image: '/assets/img/dress.svg', stock: 2, status: 'Aktif', created_at: daysAgo(2, 11) },
      { product_id: 'PRD-1003', product_name: "Denim Jacket '90s Wash", category_id: 'CAT-4', price: 165000, old_price: 289000, size: 'L', condition: 'Baik', brand: "Levi's", description: 'Jaket denim vintage dengan wash biru muda khas era 90-an. Ada sedikit fading natural di bagian siku yang justru menambah karakter. Semua kancing berfungsi normal.', image: '/assets/img/denim.svg', stock: 4, status: 'Aktif', created_at: daysAgo(3, 14) },
      { product_id: 'PRD-1004', product_name: 'White Leather Sneakers', category_id: 'CAT-2', price: 249000, old_price: 450000, size: '42', condition: 'Sangat Baik', brand: 'Adidas', description: 'Sneakers kulit putih dengan sol karet tebal. Outsole masih tebal, insole bersih, dan upper tanpa noda. Sudah disemir serta disanitasi sebelum dikirim.', image: '/assets/img/sneakers.svg', stock: 1, status: 'Aktif', created_at: daysAgo(4, 10) },
      { product_id: 'PRD-1005', product_name: 'Pink Leather Shoulder Bag', category_id: 'CAT-5', price: 265000, old_price: 480000, size: 'All Size', condition: 'Seperti Baru', brand: 'Charles & Keith', description: 'Tas bahu kulit sintetis premium warna dusty pink dengan clasp emas. Interior bersih, tanpa goresan berarti, dilengkapi dust bag asli.', image: '/assets/img/bag.svg', stock: 2, status: 'Aktif', created_at: daysAgo(5, 16) },
      { product_id: 'PRD-1006', product_name: 'Knit Cardigan Anak', category_id: 'CAT-3', price: 89000, old_price: 159000, size: '4Y', condition: 'Baik', brand: 'Mothercare', description: 'Cardigan rajut krem untuk anak usia 3-5 tahun. Bahan katun rajut lembut, tidak gatal, kancing lengkap. Ada bekas lipatan penyimpanan yang akan hilang setelah dicuci.', image: '/assets/img/cardigan.svg', stock: 5, status: 'Aktif', created_at: daysAgo(6, 9) },
      { product_id: 'PRD-1007', product_name: 'Silk Pattern Scarf', category_id: 'CAT-5', price: 79000, old_price: 145000, size: 'All Size', condition: 'Sangat Baik', brand: 'Uniqlo', description: 'Scarf sutra motif abstrak pink dan lilac, ukuran 90x90 cm. Bisa dipakai sebagai headscarf, twilly, maupun aksen leher. Halus, tanpa serat rusak.', image: '/assets/img/scarf.svg', stock: 6, status: 'Aktif', created_at: daysAgo(7, 13) },
      { product_id: 'PRD-1008', product_name: 'Linen Shirt Sand', category_id: 'CAT-2', price: 129000, old_price: 219000, size: 'M', condition: 'Baik', brand: 'Muji', description: 'Kemeja linen warna sand dengan potongan relaxed. Bahan linen 100% yang adem, cocok untuk cuaca tropis. Kancing dan jahitan utuh.', image: '/assets/img/shirt.svg', stock: 3, status: 'Aktif', created_at: daysAgo(8, 15) },
      { product_id: 'PRD-1009', product_name: 'Pleated Midi Skirt', category_id: 'CAT-1', price: 119000, old_price: 210000, size: 'M', condition: 'Sangat Baik', brand: 'Something Borrowed', description: 'Rok midi plisket warna lavender muda dengan pinggang karet. Jatuh dan ringan, cocok dipadukan dengan kaus polos maupun blazer.', image: '/assets/img/skirt.svg', stock: 2, status: 'Aktif', created_at: daysAgo(9, 12) },
      { product_id: 'PRD-1010', product_name: 'Beige Wool Coat', category_id: 'CAT-1', price: 299000, old_price: 540000, size: 'L', condition: 'Sangat Baik', brand: 'Uniqlo', description: 'Coat wol panjang warna beige dengan lining satin. Stok sedang ditahan karena sedang dalam proses pemeriksaan kualitas akhir.', image: '/assets/img/coat.svg', stock: 0, status: 'Nonaktif', created_at: daysAgo(10, 10) }
    ];

    var customers = [
      { customer_id: 'CUS-1001', name: 'Ayu Lestari', email: 'ayu.lestari@mail.com', phone: '081234567801', address: 'Jl. Melati No. 12, Kebayoran Baru', city: 'Jakarta Selatan', postal_code: '12130', created_at: daysAgo(46, 9), status: 'Aktif' },
      { customer_id: 'CUS-1002', name: 'Rina Pratiwi', email: 'rina.pratiwi@mail.com', phone: '081234567802', address: 'Jl. Cendana Raya No. 45, Sukajadi', city: 'Bandung', postal_code: '40162', created_at: daysAgo(38, 13), status: 'Aktif' },
      { customer_id: 'CUS-1003', name: 'Dimas Saputra', email: 'dimas.saputra@mail.com', phone: '081234567803', address: 'Jl. Diponegoro No. 8, Gubeng', city: 'Surabaya', postal_code: '60271', created_at: daysAgo(31, 10), status: 'Aktif' },
      { customer_id: 'CUS-1004', name: 'Nadia Putri', email: 'nadia.putri@mail.com', phone: '081234567804', address: 'Jl. Kaliurang KM 5, Sleman', city: 'Yogyakarta', postal_code: '55281', created_at: daysAgo(22, 16), status: 'Aktif' },
      { customer_id: 'CUS-1005', name: 'Bagas Wibowo', email: 'bagas.wibowo@mail.com', phone: '081234567805', address: 'Jl. Ahmad Yani No. 90, Medan Baru', city: 'Medan', postal_code: '20153', created_at: daysAgo(15, 11), status: 'Aktif' },
      { customer_id: 'CUS-1006', name: 'Sinta Maharani', email: 'sinta.maharani@mail.com', phone: '081234567806', address: 'Jl. Pemuda No. 21, Semarang Tengah', city: 'Semarang', postal_code: '50132', created_at: daysAgo(7, 14), status: 'Nonaktif' }
    ];

    var orderSeed = [
      { c: 'CUS-1001', day: 1, items: [['PRD-1002', 1]], status: 'Pending', pay: 'Transfer Bank', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1002', day: 1, items: [['PRD-1005', 1], ['PRD-1007', 1]], status: 'Diproses', pay: 'QRIS', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1003', day: 2, items: [['PRD-1004', 1]], status: 'Dikirim', pay: 'E-Wallet', ship: 'Express (1-2 hari)' },
      { c: 'CUS-1004', day: 3, items: [['PRD-1001', 1], ['PRD-1009', 1]], status: 'Selesai', pay: 'Transfer Bank', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1005', day: 4, items: [['PRD-1008', 1]], status: 'Selesai', pay: 'COD (Bayar di Tempat)', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1001', day: 6, items: [['PRD-1003', 1]], status: 'Selesai', pay: 'QRIS', ship: 'Ambil di Toko' },
      { c: 'CUS-1006', day: 8, items: [['PRD-1006', 2]], status: 'Dibatalkan', pay: 'Transfer Bank', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1002', day: 10, items: [['PRD-1007', 1], ['PRD-1002', 1]], status: 'Selesai', pay: 'E-Wallet', ship: 'Express (1-2 hari)' },
      { c: 'CUS-1003', day: 13, items: [['PRD-1001', 1]], status: 'Selesai', pay: 'Transfer Bank', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1004', day: 17, items: [['PRD-1005', 1]], status: 'Selesai', pay: 'QRIS', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1005', day: 21, items: [['PRD-1004', 1], ['PRD-1003', 1]], status: 'Selesai', pay: 'Transfer Bank', ship: 'Express (1-2 hari)' },
      { c: 'CUS-1001', day: 26, items: [['PRD-1008', 1], ['PRD-1007', 2]], status: 'Selesai', pay: 'COD (Bayar di Tempat)', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1006', day: 33, items: [['PRD-1006', 1]], status: 'Selesai', pay: 'QRIS', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1003', day: 41, items: [['PRD-1002', 1]], status: 'Selesai', pay: 'Transfer Bank', ship: 'Reguler (2-4 hari)' },
      { c: 'CUS-1004', day: 48, items: [['PRD-1009', 1], ['PRD-1001', 1]], status: 'Selesai', pay: 'E-Wallet', ship: 'Express (1-2 hari)' }
    ];

    var byId = {};
    products.forEach(function (p) { byId[p.product_id] = p; });
    var custById = {};
    customers.forEach(function (c) { custById[c.customer_id] = c; });

    var orders = orderSeed.map(function (o, i) {
      var cust = custById[o.c];
      var items = o.items.map(function (it) {
        var p = byId[it[0]];
        return {
          product_id: p.product_id,
          product_name: p.product_name,
          image: p.image,
          size: p.size,
          price: p.price,
          quantity: it[1]
        };
      });
      var subtotal = items.reduce(function (s, it) { return s + it.price * it.quantity; }, 0);
      var shipping = SHIPPING[o.ship] || 0;
      return {
        order_id: 'PL-' + (2001 + i),
        customer_id: cust.customer_id,
        customer_name: cust.name,
        phone: cust.phone,
        email: cust.email,
        order_date: daysAgo(o.day, 8 + (i % 10)),
        items: items,
        subtotal: subtotal,
        shipping_method: o.ship,
        shipping_cost: shipping,
        total_price: subtotal + shipping,
        payment_method: o.pay,
        shipping_address: cust.address,
        city: cust.city,
        postal_code: cust.postal_code,
        order_status: o.status,
        note: ''
      };
    });

    return {
      version: 1,
      admins: [
        { admin_id: 'ADM-1', username: 'admin', password_hash: ADMIN_HASH, created_at: daysAgo(60, 9) }
      ],
      products: products,
      categories: categories,
      customers: customers,
      orders: orders,
      cart: [],
      wishlist: [],
      settings: {
        store_name: 'PINKLOOP',
        tagline: 'Preloved Fashion, New Stories.',
        logo: '',
        email: 'hello@pinkloop.id',
        whatsapp: '0812 3456 7890',
        description: 'PINKLOOP adalah marketplace fashion preloved yang menghubungkan pemilik barang berkualitas dengan pemilik baru. Setiap barang dikurasi, dicuci, dan diperiksa sebelum dikirim.'
      },
      seq: { product: 1010, category: 5, order: 2000 + orderSeed.length, customer: 1006 }
    };
  }

  /* ---------- persistence ---------- */
  var cache = null;

  function read() {
    if (cache) return cache;
    try {
      var raw = global.localStorage.getItem(DB_KEY);
      if (raw) cache = JSON.parse(raw);
    } catch (e) { cache = null; }
    if (!cache || !cache.products) {
      cache = seed();
      persist();
    }
    return cache;
  }

  function persist() {
    try {
      global.localStorage.setItem(DB_KEY, JSON.stringify(cache));
    } catch (e) {
      console.warn('PINKLOOP: penyimpanan penuh', e);
      if (global.PLUI && global.PLUI.toast) {
        global.PLUI.toast('Penyimpanan browser penuh. Hapus beberapa foto produk.', 'error');
      }
    }
  }

  function commit() { persist(); }

  /* ---------- formatting ---------- */
  function money(n) {
    return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
  }
  function shortMoney(n) {
    var v = Number(n || 0);
    if (v >= 1000000) return 'Rp ' + (v / 1000000).toFixed(v >= 10000000 ? 0 : 1).replace('.', ',') + 'jt';
    if (v >= 1000) return 'Rp ' + Math.round(v / 1000) + 'rb';
    return money(v);
  }
  function formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function formatDateTime(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
  function dateKey(d) {
    var x = new Date(d);
    return x.getFullYear() + '-' + pad(x.getMonth() + 1, 2) + '-' + pad(x.getDate(), 2);
  }
  function categoryName(id) {
    var c = read().categories.find(function (x) { return x.category_id === id; });
    return c ? c.category_name : 'Tanpa kategori';
  }

  /* ---------- categories ---------- */
  function getCategories() {
    return clone(read().categories);
  }
  function categoryProductCount(id) {
    return read().products.filter(function (p) { return p.category_id === id; }).length;
  }
  function saveCategory(data) {
    var db = read();
    var name = String(data.category_name || '').trim();
    if (!name) return { ok: false, message: 'Nama kategori wajib diisi.' };
    var dup = db.categories.some(function (c) {
      return c.category_name.toLowerCase() === name.toLowerCase() && c.category_id !== data.category_id;
    });
    if (dup) return { ok: false, message: 'Nama kategori sudah digunakan.' };

    if (data.category_id) {
      var found = db.categories.find(function (c) { return c.category_id === data.category_id; });
      if (!found) return { ok: false, message: 'Kategori tidak ditemukan.' };
      found.category_name = name;
      found.icon = String(data.icon || '🏷️').trim() || '🏷️';
      commit();
      return { ok: true, category: clone(found), message: 'Kategori berhasil diperbarui.' };
    }
    var cat = {
      category_id: 'CAT-' + (++db.seq.category),
      category_name: name,
      icon: String(data.icon || '🏷️').trim() || '🏷️'
    };
    db.categories.push(cat);
    commit();
    return { ok: true, category: clone(cat), message: 'Kategori berhasil ditambahkan.' };
  }
  function deleteCategory(id) {
    var db = read();
    var used = db.products.filter(function (p) { return p.category_id === id; }).length;
    if (used > 0) {
      return { ok: false, message: 'Kategori masih dipakai oleh ' + used + ' produk. Pindahkan produk terlebih dahulu.' };
    }
    db.categories = db.categories.filter(function (c) { return c.category_id !== id; });
    commit();
    return { ok: true, message: 'Kategori berhasil dihapus.' };
  }

  /* ---------- products ---------- */
  function getProducts(opts) {
    var includeInactive = opts && opts.includeInactive;
    return clone(read().products.filter(function (p) {
      return includeInactive ? true : p.status === 'Aktif';
    }));
  }
  function getProduct(id) {
    var p = read().products.find(function (x) { return x.product_id === id; });
    return p ? clone(p) : null;
  }
  function saveProduct(data) {
    var db = read();
    var errors = [];
    var name = String(data.product_name || '').trim();
    var price = Number(data.price);
    var stock = Number(data.stock);
    var oldPrice = data.old_price === '' || data.old_price == null ? null : Number(data.old_price);

    if (!name) errors.push('Nama produk wajib diisi.');
    if (!data.category_id) errors.push('Kategori wajib dipilih.');
    if (!Number.isFinite(price) || price <= 0) errors.push('Harga harus lebih besar dari 0.');
    if (oldPrice != null && (!Number.isFinite(oldPrice) || oldPrice < 0)) errors.push('Harga sebelum diskon tidak valid.');
    if (oldPrice != null && oldPrice > 0 && oldPrice < price) errors.push('Harga sebelum diskon harus lebih besar dari harga jual.');
    if (!Number.isInteger(stock) || stock < 0) errors.push('Stok harus berupa angka bulat 0 atau lebih.');
    if (!String(data.size || '').trim()) errors.push('Ukuran wajib diisi.');
    if (!String(data.condition || '').trim()) errors.push('Kondisi barang wajib dipilih.');
    if (errors.length) return { ok: false, message: errors[0], errors: errors };

    if (data.product_id) {
      var p = db.products.find(function (x) { return x.product_id === data.product_id; });
      if (!p) return { ok: false, message: 'Produk tidak ditemukan.' };
      p.product_name = name;
      p.category_id = data.category_id;
      p.price = price;
      p.old_price = oldPrice;
      p.size = String(data.size).trim();
      p.condition = data.condition;
      p.brand = String(data.brand || '').trim();
      p.description = String(data.description || '').trim();
      if (data.image) p.image = data.image;
      p.stock = stock;
      p.status = data.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif';
      commit();
      return { ok: true, product: clone(p), message: 'Perubahan produk berhasil disimpan.' };
    }

    var product = {
      product_id: 'PRD-' + (++db.seq.product),
      product_name: name,
      category_id: data.category_id,
      price: price,
      old_price: oldPrice,
      size: String(data.size).trim(),
      condition: data.condition,
      brand: String(data.brand || '').trim(),
      description: String(data.description || '').trim(),
      image: data.image || '',
      stock: stock,
      status: data.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
      created_at: new Date().toISOString()
    };
    db.products.unshift(product);
    commit();
    return { ok: true, product: clone(product), message: 'Produk baru berhasil ditambahkan.' };
  }
  function deleteProduct(id) {
    var db = read();
    var before = db.products.length;
    db.products = db.products.filter(function (p) { return p.product_id !== id; });
    if (db.products.length === before) return { ok: false, message: 'Produk tidak ditemukan.' };
    db.cart = db.cart.filter(function (c) { return c.product_id !== id; });
    db.wishlist = db.wishlist.filter(function (w) { return w.product_id !== id; });
    commit();
    return { ok: true, message: 'Produk berhasil dihapus dari katalog.' };
  }
  function toggleProductStatus(id) {
    var db = read();
    var p = db.products.find(function (x) { return x.product_id === id; });
    if (!p) return { ok: false, message: 'Produk tidak ditemukan.' };
    p.status = p.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    commit();
    return { ok: true, message: 'Status produk diubah menjadi ' + p.status + '.', status: p.status };
  }
  function soldCount(productId, orders) {
    var list = orders || read().orders;
    return list.reduce(function (sum, o) {
      if (o.order_status === 'Dibatalkan') return sum;
      return sum + o.items.reduce(function (s, it) {
        return it.product_id === productId ? s + it.quantity : s;
      }, 0);
    }, 0);
  }

  /* ---------- customers ---------- */
  function getCustomers() {
    var db = read();
    return clone(db.customers.map(function (c) {
      var orders = db.orders.filter(function (o) { return o.customer_id === c.customer_id; });
      var valid = orders.filter(function (o) { return o.order_status !== 'Dibatalkan'; });
      return Object.assign({}, c, {
        transactions: valid.length,
        spent: valid.reduce(function (s, o) { return s + o.total_price; }, 0),
        last_order: orders.length ? orders.map(function (o) { return o.order_date; }).sort().pop() : null
      });
    }).sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); }));
  }
  function getCustomer(id) {
    return getCustomers().find(function (c) { return c.customer_id === id; }) || null;
  }
  function updateCustomer(id, patch) {
    var db = read();
    var c = db.customers.find(function (x) { return x.customer_id === id; });
    if (!c) return { ok: false, message: 'Pelanggan tidak ditemukan.' };
    Object.assign(c, patch);
    commit();
    return { ok: true, customer: clone(c), message: 'Data pelanggan diperbarui.' };
  }
  function upsertCustomer(data) {
    var db = read();
    var phone = String(data.phone || '').replace(/\s+/g, '');
    var existing = db.customers.find(function (c) {
      return c.phone.replace(/\s+/g, '') === phone || (data.email && c.email.toLowerCase() === String(data.email).toLowerCase());
    });
    if (existing) {
      existing.name = data.name || existing.name;
      existing.phone = data.phone || existing.phone;
      if (data.email) existing.email = data.email;
      if (data.address) existing.address = data.address;
      if (data.city) existing.city = data.city;
      if (data.postal_code) existing.postal_code = data.postal_code;
      return existing;
    }
    var customer = {
      customer_id: 'CUS-' + (++db.seq.customer),
      name: data.name,
      email: data.email || '',
      phone: data.phone,
      address: data.address || '',
      city: data.city || '',
      postal_code: data.postal_code || '',
      created_at: new Date().toISOString(),
      status: 'Aktif'
    };
    db.customers.push(customer);
    return customer;
  }

  /* ---------- orders ---------- */
  function getOrders() {
    return clone(read().orders.slice().sort(function (a, b) {
      return new Date(b.order_date) - new Date(a.order_date);
    }));
  }
  function getOrder(id) {
    var o = read().orders.find(function (x) { return x.order_id === id; });
    return o ? clone(o) : null;
  }
  function createOrder(payload) {
    var db = read();
    var errors = [];
    ['name', 'phone', 'address', 'city', 'postal_code', 'shipping_method', 'payment_method'].forEach(function (f) {
      if (!String(payload[f] || '').trim()) errors.push('Kolom ' + f + ' wajib diisi.');
    });
    if (!String(payload.name || '').trim()) errors.push('Nama penerima wajib diisi.');
    if (!/^0[0-9]{8,13}$/.test(String(payload.phone || '').replace(/[\s-]/g, ''))) {
      errors.push('Nomor WhatsApp tidak valid (contoh: 081234567890).');
    }
    if (!/^[0-9]{5}$/.test(String(payload.postal_code || '').trim())) {
      errors.push('Kode pos harus 5 angka.');
    }
    if (!db.cart.length) errors.push('Keranjang masih kosong.');
    if (errors.length) return { ok: false, message: errors[0], errors: errors };

    var items = [];
    for (var i = 0; i < db.cart.length; i++) {
      var entry = db.cart[i];
      var p = db.products.find(function (x) { return x.product_id === entry.product_id; });
      if (!p || p.status !== 'Aktif') {
        return { ok: false, message: 'Salah satu produk sudah tidak tersedia. Perbarui keranjang.' };
      }
      if (p.stock < entry.quantity) {
        return { ok: false, message: 'Stok "' + p.product_name + '" tinggal ' + p.stock + '.' };
      }
      items.push({
        product_id: p.product_id,
        product_name: p.product_name,
        image: p.image,
        size: p.size,
        price: p.price,
        quantity: entry.quantity
      });
    }

    var subtotal = items.reduce(function (s, it) { return s + it.price * it.quantity; }, 0);
    var shipping = SHIPPING[payload.shipping_method] || 0;
    var customer = upsertCustomer(payload);
    var order = {
      order_id: 'PL-' + (++db.seq.order),
      customer_id: customer.customer_id,
      customer_name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: String(payload.email || '').trim(),
      order_date: new Date().toISOString(),
      items: items,
      subtotal: subtotal,
      shipping_method: payload.shipping_method,
      shipping_cost: shipping,
      total_price: subtotal + shipping,
      payment_method: payload.payment_method,
      shipping_address: payload.address.trim(),
      city: payload.city.trim(),
      postal_code: payload.postal_code.trim(),
      order_status: 'Pending',
      note: String(payload.note || '').trim()
    };

    // stok berkurang saat pesanan berhasil dibuat
    items.forEach(function (it) {
      var p = db.products.find(function (x) { return x.product_id === it.product_id; });
      if (p) p.stock = Math.max(0, p.stock - it.quantity);
    });

    db.orders.unshift(order);
    db.cart = [];
    commit();
    return { ok: true, order: clone(order), message: 'Pesanan ' + order.order_id + ' berhasil dibuat.' };
  }
  function updateOrderStatus(id, status) {
    var db = read();
    if (STATUSES.indexOf(status) === -1) return { ok: false, message: 'Status tidak valid.' };
    var o = db.orders.find(function (x) { return x.order_id === id; });
    if (!o) return { ok: false, message: 'Pesanan tidak ditemukan.' };
    if (o.order_status === status) return { ok: true, order: clone(o), message: 'Status tidak berubah.' };

    var wasCancelled = o.order_status === 'Dibatalkan';
    var willCancel = status === 'Dibatalkan';
    if (willCancel && !wasCancelled) {
      o.items.forEach(function (it) {
        var p = db.products.find(function (x) { return x.product_id === it.product_id; });
        if (p) p.stock += it.quantity;
      });
    } else if (!willCancel && wasCancelled) {
      for (var i = 0; i < o.items.length; i++) {
        var it = o.items[i];
        var prod = db.products.find(function (x) { return x.product_id === it.product_id; });
        if (prod && prod.stock < it.quantity) {
          return { ok: false, message: 'Stok "' + prod.product_name + '" tidak cukup untuk mengaktifkan kembali pesanan.' };
        }
      }
      o.items.forEach(function (it) {
        var p = db.products.find(function (x) { return x.product_id === it.product_id; });
        if (p) p.stock = Math.max(0, p.stock - it.quantity);
      });
    }
    o.order_status = status;
    o.updated_at = new Date().toISOString();
    commit();
    return { ok: true, order: clone(o), message: 'Status pesanan ' + id + ' diperbarui menjadi ' + status + '.' };
  }

  /* ---------- cart ---------- */
  function getCart() {
    var db = read();
    return db.cart.map(function (entry) {
      var p = db.products.find(function (x) { return x.product_id === entry.product_id; });
      if (!p) return null;
      return {
        product_id: p.product_id,
        product_name: p.product_name,
        price: p.price,
        image: p.image,
        size: p.size,
        stock: p.stock,
        status: p.status,
        quantity: entry.quantity
      };
    }).filter(Boolean);
  }
  function addToCart(productId, qty) {
    var db = read();
    var p = db.products.find(function (x) { return x.product_id === productId; });
    if (!p || p.status !== 'Aktif') return { ok: false, message: 'Produk tidak tersedia.' };
    if (p.stock < 1) return { ok: false, message: 'Stok produk habis.' };
    var amount = Math.max(1, Number(qty) || 1);
    var entry = db.cart.find(function (c) { return c.product_id === productId; });
    var current = entry ? entry.quantity : 0;
    if (current + amount > p.stock) {
      return { ok: false, message: 'Jumlah melebihi stok tersedia (' + p.stock + ').' };
    }
    if (entry) entry.quantity += amount;
    else db.cart.push({ product_id: productId, quantity: amount });
    commit();
    return { ok: true, message: '“' + p.product_name + '” ditambahkan ke keranjang.' };
  }
  function updateCartQty(productId, qty) {
    var db = read();
    var entry = db.cart.find(function (c) { return c.product_id === productId; });
    if (!entry) return { ok: false, message: 'Produk tidak ada di keranjang.' };
    var p = db.products.find(function (x) { return x.product_id === productId; });
    var max = p ? p.stock : 1;
    var next = Math.max(1, Math.min(Number(qty) || 1, max));
    entry.quantity = next;
    commit();
    return { ok: true, quantity: next, message: 'Jumlah diperbarui.' };
  }
  function removeFromCart(productId) {
    var db = read();
    db.cart = db.cart.filter(function (c) { return c.product_id !== productId; });
    commit();
    return { ok: true, message: 'Produk dihapus dari keranjang.' };
  }
  function clearCart() {
    var db = read();
    db.cart = [];
    commit();
  }
  function cartCount() {
    return read().cart.reduce(function (s, c) { return s + c.quantity; }, 0);
  }
  function cartSummary() {
    var items = getCart();
    var subtotal = items.reduce(function (s, it) {
      return s + (it.status === 'Aktif' ? it.price * it.quantity : 0);
    }, 0);
    return {
      items: items,
      count: items.reduce(function (s, it) { return s + it.quantity; }, 0),
      subtotal: subtotal,
      shippingCost: SHIPPING['Reguler (2-4 hari)'],
      total: subtotal + SHIPPING['Reguler (2-4 hari)']
    };
  }

  /* ---------- wishlist ---------- */
  function getWishlist() {
    var db = read();
    return db.wishlist.map(function (w) {
      var p = db.products.find(function (x) { return x.product_id === w.product_id; });
      if (!p || p.status !== 'Aktif') return null;
      return Object.assign(clone(p), { added_at: w.added_at });
    }).filter(Boolean);
  }
  function isWishlisted(productId) {
    return read().wishlist.some(function (w) { return w.product_id === productId; });
  }
  function toggleWishlist(productId) {
    var db = read();
    var idx = db.wishlist.findIndex(function (w) { return w.product_id === productId; });
    if (idx >= 0) {
      db.wishlist.splice(idx, 1);
      commit();
      return { ok: true, added: false, message: 'Dihapus dari wishlist.' };
    }
    db.wishlist.push({ product_id: productId, added_at: new Date().toISOString() });
    commit();
    return { ok: true, added: true, message: 'Ditambahkan ke wishlist.' };
  }
  function wishlistCount() { return read().wishlist.length; }

  /* ---------- admin auth ---------- */
  function sha256(text) {
    if (global.crypto && global.crypto.subtle && global.TextEncoder) {
      return global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      });
    }
    return Promise.reject(new Error('Browser tidak mendukung Web Crypto API.'));
  }

  function readSession() {
    try {
      var raw = global.sessionStorage.getItem(SESSION_KEY) || global.localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.username || !s.expires_at) return null;
      if (new Date(s.expires_at).getTime() < Date.now()) {
        logout();
        return null;
      }
      return s;
    } catch (e) { return null; }
  }
  function login(username, password) {
    var db = read();
    var admin = db.admins.find(function (a) { return a.username.toLowerCase() === String(username || '').trim().toLowerCase(); });
    var generic = { ok: false, message: 'Username atau password salah.' };
    if (!admin) return Promise.resolve(generic);
    return sha256(String(password || '')).then(function (hash) {
      if (hash !== admin.password_hash) return generic;
      var session = {
        username: admin.username,
        admin_id: admin.admin_id,
        login_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + SESSION_TTL).toISOString()
      };
      global.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      global.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { ok: true, session: session, message: 'Login berhasil. Selamat datang, ' + admin.username + '!' };
    }).catch(function () {
      return { ok: false, message: 'Login gagal: Web Crypto tidak tersedia di browser ini.' };
    });
  }
  function logout() {
    try {
      global.sessionStorage.removeItem(SESSION_KEY);
      global.localStorage.removeItem(SESSION_KEY);
    } catch (e) { /* abaikan */ }
  }
  function currentAdmin() {
    var s = readSession();
    if (!s) return null;
    var db = read();
    var admin = db.admins.find(function (a) { return a.admin_id === s.admin_id; });
    if (!admin) return null;
    return { admin_id: admin.admin_id, username: admin.username, login_at: s.login_at };
  }
  function isAdmin() { return !!currentAdmin(); }
  function refreshSession() {
    var s = readSession();
    if (!s) return null;
    s.expires_at = new Date(Date.now() + SESSION_TTL).toISOString();
    try {
      global.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
      global.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    } catch (e) { /* abaikan */ }
    return s;
  }
  function updateAdmin(data) {
    var db = read();
    var admin = db.admins[0];
    if (!admin) return Promise.resolve({ ok: false, message: 'Akun admin tidak ditemukan.' });
    var username = String(data.username || '').trim();
    if (username.length < 3) return Promise.resolve({ ok: false, message: 'Username minimal 3 karakter.' });
    return sha256(String(data.current_password || '')).then(function (currentHash) {
      if (currentHash !== admin.password_hash) {
        return { ok: false, message: 'Password saat ini tidak sesuai.' };
      }
      var newPass = String(data.new_password || '');
      if (newPass) {
        if (newPass.length < 6) return { ok: false, message: 'Password baru minimal 6 karakter.' };
        if (newPass !== data.confirm_password) return { ok: false, message: 'Konfirmasi password tidak sama.' };
        return sha256(newPass).then(function (h) {
          admin.username = username;
          admin.password_hash = h;
          commit();
          return { ok: true, message: 'Kredensial admin berhasil diperbarui.' };
        });
      }
      admin.username = username;
      commit();
      return { ok: true, message: 'Username admin berhasil diperbarui.' };
    });
  }

  /* ---------- settings ---------- */
  function getSettings() { return clone(read().settings); }
  function saveSettings(patch) {
    var db = read();
    Object.assign(db.settings, patch);
    commit();
    return { ok: true, message: 'Pengaturan toko berhasil disimpan.' };
  }

  /* ---------- analytics ---------- */
  function dashboardStats() {
    var db = read();
    var valid = db.orders.filter(function (o) { return o.order_status !== 'Dibatalkan'; });
    return {
      totalProducts: db.products.length,
      activeProducts: db.products.filter(function (p) { return p.status === 'Aktif'; }).length,
      lowStock: db.products.filter(function (p) { return p.stock <= 1; }).length,
      totalOrders: db.orders.length,
      pendingOrders: db.orders.filter(function (o) { return o.order_status === 'Pending'; }).length,
      totalCustomers: db.customers.length,
      revenue: valid.reduce(function (s, o) { return s + o.total_price; }, 0),
      unitsSold: valid.reduce(function (s, o) {
        return s + o.items.reduce(function (x, it) { return x + it.quantity; }, 0);
      }, 0)
    };
  }

  var PL = {
    STATUSES: STATUSES,
    PAYMENTS: PAYMENTS,
    SHIPPING: SHIPPING,
    money: money,
    shortMoney: shortMoney,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    dateKey: dateKey,
    categoryName: categoryName,
    db: read,
    save: commit,
    seed,
    resetDemoData: function () {
      cache = seed();
      commit();
    },
    getCategories: getCategories,
    categoryProductCount: categoryProductCount,
    saveCategory: saveCategory,
    deleteCategory: deleteCategory,
    getProducts: getProducts,
    getProduct: getProduct,
    saveProduct: saveProduct,
    deleteProduct: deleteProduct,
    toggleProductStatus: toggleProductStatus,
    soldCount: soldCount,
    getCustomers: getCustomers,
    getCustomer: getCustomer,
    updateCustomer: updateCustomer,
    getOrders: getOrders,
    getOrder: getOrder,
    createOrder: createOrder,
    updateOrderStatus: updateOrderStatus,
    getCart: getCart,
    addToCart: addToCart,
    updateCartQty: updateCartQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    cartCount: cartCount,
    cartSummary: cartSummary,
    getWishlist: getWishlist,
    isWishlisted: isWishlisted,
    toggleWishlist: toggleWishlist,
    wishlistCount: wishlistCount,
    login: login,
    logout: logout,
    currentAdmin: currentAdmin,
    isAdmin: isAdmin,
    refreshSession: refreshSession,
    updateAdmin: updateAdmin,
    getSettings: getSettings,
    saveSettings: saveSettings,
    dashboardStats: dashboardStats
  };

  global.PL = PL;
})(window);
