/* PINKLOOP – wishlist pengguna */
(function () {
  'use strict';
  PLUI.renderChrome('wishlist');

  var grid = document.getElementById('wishGrid');
  var emptyBox = document.getElementById('wishEmpty');
  var countEl = document.getElementById('wishCount');

  function render() {
    var items = PL.getWishlist();
    countEl.textContent = items.length + ' produk disimpan';
    grid.innerHTML = items.map(PLUI.productCard).join('');
    emptyBox.hidden = items.length > 0;
    if (!items.length) {
      emptyBox.innerHTML = PLUI.renderEmpty(
        'Wishlist masih kosong',
        'Tekan ikon hati pada produk untuk menyimpannya di sini.',
        '<a class="btn btn-primary btn-sm" href="/catalog.html" style="margin-top:1.2rem">Jelajahi katalog</a>'
      );
    }
    PLUI.updateBadges();
  }

  grid.addEventListener('click', function () {
    // re-render setelah toggle wishlist agar kartu yang dihapus langsung hilang
    setTimeout(render, 60);
  });

  PLUI.bindProductGrid(grid);
  render();
})();
