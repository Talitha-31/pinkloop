/* PINKLOOP – admin core: guard, shell, modal, chart, util */
(function (global) {
  'use strict';

  var esc = PLUI.esc;

  function toast(message, type) { PLUI.toast(message, type); }

  function setHeader(title, subtitle) {
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;
  }

  function statusMeta(status) {
    var map = {
      'Pending': { cls: 'pill-yellow', text: 'Pending' },
      'Diproses': { cls: 'pill-blue', text: 'Diproses' },
      'Dikirim': { cls: 'pill-purple', text: 'Dikirim' },
      'Selesai': { cls: 'pill-green', text: 'Selesai' },
      'Dibatalkan': { cls: 'pill-red', text: 'Dibatalkan' }
    };
    var m = map[status] || { cls: 'pill-gray', text: status };
    return '<span class="pill ' + m.cls + '">' + esc(m.text) + '</span>';
  }

  function productStatusPill(status) {
    return status === 'Aktif'
      ? '<span class="pill pill-green">Aktif</span>'
      : '<span class="pill pill-gray">Nonaktif</span>';
  }

  /* ---------- modal ---------- */
  var backdrop = document.getElementById('modalBackdrop');
  var box = document.getElementById('modalBox');

  function closeModal() {
    backdrop.hidden = true;
    box.innerHTML = '';
    document.body.style.overflow = '';
  }

  function modal(opts) {
    box.className = 'modal' + (opts.size === 'narrow' ? ' narrow' : '');
    box.innerHTML = '' +
      '<div class="modal-head">' +
        '<div><h2>' + esc(opts.title || '') + '</h2>' +
        (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
        '<button class="modal-close" type="button" data-modal-close aria-label="Tutup">✕</button>' +
      '</div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>';
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    box.querySelectorAll('[data-modal-close]').forEach(function (b) {
      b.addEventListener('click', closeModal);
    });
    return box;
  }

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal();
  });

  function confirmDialog(opts) {
    var el = modal({
      title: opts.title || 'Konfirmasi',
      subtitle: opts.subtitle || '',
      size: 'narrow',
      body: '<p class="small muted" style="margin-bottom:1.2rem">' + esc(opts.message || '') + '</p>' +
        '<div class="form-actions" style="margin-top:0">' +
          '<button class="btn btn-ghost" type="button" data-modal-close>Batal</button>' +
          '<button class="btn ' + (opts.danger === false ? 'btn-primary' : 'btn-danger') + '" type="button" id="confirmYes">' +
            esc(opts.confirmLabel || 'Hapus') + '</button>' +
        '</div>'
    });
    el.querySelector('#confirmYes').addEventListener('click', function () {
      closeModal();
      if (typeof opts.onConfirm === 'function') opts.onConfirm();
    });
  }

  /* ---------- image ---------- */
  function resizeImage(file, maxW, quality) {
    maxW = maxW || 900;
    quality = quality || 0.82;
    return new Promise(function (resolve, reject) {
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        return reject(new Error('Format gambar harus JPG, PNG, atau WEBP.'));
      }
      if (file.size > 4 * 1024 * 1024) {
        return reject(new Error('Ukuran gambar maksimal 4 MB.'));
      }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, maxW / img.width);
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          var ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = function () { reject(new Error('Gambar tidak dapat dibaca.')); };
        img.src = reader.result;
      };
      reader.onerror = function () { reject(new Error('Gagal membaca file.')); };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- charts (SVG) ---------- */
  function lineChart(series, opts) {
    opts = opts || {};
    if (!series || !series.length) return '<div class="chart-empty">Belum ada data untuk ditampilkan.</div>';
    var W = 640, H = opts.height || 210;
    var pad = { top: 18, right: 16, bottom: 30, left: 46 };
    var innerW = W - pad.left - pad.right;
    var innerH = H - pad.top - pad.bottom;
    var max = Math.max.apply(null, series.map(function (d) { return d.value; }).concat([1]));
    var top = max * 1.18;
    var n = series.length;
    var stepX = n > 1 ? innerW / (n - 1) : 0;
    var color = opts.color || '#E85D9B';

    function xAt(i) { return pad.left + (n > 1 ? i * stepX : innerW / 2); }
    function yAt(v) { return pad.top + innerH * (1 - v / top); }

    var points = series.map(function (d, i) { return xAt(i) + ',' + yAt(d.value); });
    var area = 'M' + xAt(0) + ',' + (pad.top + innerH) + ' L' + points.join(' L') +
      ' L' + xAt(n - 1) + ',' + (pad.top + innerH) + ' Z';

    var grid = '';
    for (var g = 0; g <= 4; g++) {
      var val = top * (g / 4);
      var y = yAt(val);
      grid += '<line x1="' + pad.left + '" y1="' + y + '" x2="' + (W - pad.right) + '" y2="' + y + '" stroke="#F1E5EC" stroke-width="1"/>' +
        '<text x="' + (pad.left - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#A292A4">' +
        (opts.formatY ? opts.formatY(val) : Math.round(val)) + '</text>';
    }

    var labelEvery = n > 10 ? Math.ceil(n / 7) : 1;
    var labels = series.map(function (d, i) {
      if (i % labelEvery !== 0 && i !== n - 1) return '';
      return '<text x="' + xAt(i) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#A292A4">' + esc(d.label) + '</text>';
    }).join('');

    var dots = series.map(function (d, i) {
      return '<circle cx="' + xAt(i) + '" cy="' + yAt(d.value) + '" r="3.2" fill="#fff" stroke="' + color + '" stroke-width="2"/>';
    }).join('');

    return '<div class="chart-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik garis">' +
      '<defs><linearGradient id="grad-' + (opts.id || 'a') + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + color + '" stop-opacity=".28"/>' +
        '<stop offset="1" stop-color="' + color + '" stop-opacity="0"/>' +
      '</linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#grad-' + (opts.id || 'a') + ')"/>' +
      '<polyline points="' + points.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + labels +
    '</svg></div>';
  }

  function barChart(series, opts) {
    opts = opts || {};
    if (!series || !series.length) return '<div class="chart-empty">Belum ada data untuk ditampilkan.</div>';
    var W = 640, H = opts.height || 210;
    var pad = { top: 18, right: 16, bottom: 30, left: 46 };
    var innerW = W - pad.left - pad.right;
    var innerH = H - pad.top - pad.bottom;
    var max = Math.max.apply(null, series.map(function (d) { return d.value; }).concat([1]));
    var top = max * 1.18;
    var n = series.length;
    var slot = innerW / n;
    var barW = Math.min(38, slot * 0.55);
    var color = opts.color || '#B79BE6';

    var bars = series.map(function (d, i) {
      var h = innerH * (d.value / top);
      var x = pad.left + slot * i + (slot - barW) / 2;
      var y = pad.top + innerH - h;
      return '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + Math.max(2, h) + '" rx="6" fill="' + color + '"/>' +
        '<text x="' + (x + barW / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="#A292A4">' + esc(d.label) + '</text>' +
        (d.value ? '<text x="' + (x + barW / 2) + '" y="' + (y - 6) + '" text-anchor="middle" font-size="10" fill="#6D5C6E">' + d.value + '</text>' : '');
    }).join('');

    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var y2 = pad.top + innerH * (g / 3);
      grid += '<line x1="' + pad.left + '" y1="' + y2 + '" x2="' + (W - pad.right) + '" y2="' + y2 + '" stroke="#F1E5EC" stroke-width="1"/>';
    }

    return '<div class="chart-wrap"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Grafik batang">' +
      grid + bars + '</svg></div>';
  }

  /* ---------- shell ---------- */
  function mountShell() {
    var admin = PL.currentAdmin();
    if (!admin) return;
    document.getElementById('profileName').textContent = admin.username;
    document.getElementById('profileAvatar').textContent = admin.username.charAt(0);
    document.getElementById('sidebarStoreName').textContent = PL.getSettings().store_name || 'PINKLOOP';

    var sidebar = document.getElementById('sidebar');
    var scrim = document.getElementById('sidebarScrim');
    function closeSidebar() {
      sidebar.classList.remove('open');
      scrim.classList.remove('show');
    }
    document.getElementById('hamburger').addEventListener('click', function () {
      sidebar.classList.add('open');
      scrim.classList.add('show');
    });
    scrim.addEventListener('click', closeSidebar);
    document.getElementById('sidebarNav').addEventListener('click', function (e) {
      if (e.target.closest('a')) closeSidebar();
    });

    function doLogout() {
      confirmDialog({
        title: 'Logout dari dashboard?',
        message: 'Kamu akan diarahkan kembali ke halaman login admin.',
        confirmLabel: 'Logout',
        onConfirm: function () {
          PL.logout();
          location.replace('/admin/login/');
        }
      });
    }
    document.getElementById('sidebarLogout').addEventListener('click', doLogout);
    document.getElementById('profileLogout').addEventListener('click', doLogout);
  }

  global.ADM = {
    esc: esc,
    toast: toast,
    setHeader: setHeader,
    statusMeta: statusMeta,
    statusPill: function (s) { return statusMeta(s); },
    productStatusPill: productStatusPill,
    modal: modal,
    closeModal: closeModal,
    confirmDialog: confirmDialog,
    resizeImage: resizeImage,
    lineChart: lineChart,
    barChart: barChart,
    mountShell: mountShell
  };
})(window);
