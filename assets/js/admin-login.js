/* PINKLOOP – login admin */
(function () {
  'use strict';

  // Sudah login? langsung ke dashboard.
  if (PL.isAdmin()) {
    location.replace('/admin/');
    return;
  }

  var form = document.getElementById('loginForm');
  var errorBox = document.getElementById('loginError');
  var password = document.getElementById('password');
  var toggle = document.getElementById('togglePassword');
  var btn = document.getElementById('loginBtn');

  toggle.addEventListener('click', function () {
    var show = password.type === 'password';
    password.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Sembunyikan' : 'Lihat';
    toggle.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
    password.focus();
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add('show');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.classList.remove('show');

    var username = form.username.value.trim();
    var pass = password.value;

    if (!username) {
      showError('Username wajib diisi.');
      form.username.focus();
      return;
    }
    if (!pass) {
      showError('Password wajib diisi.');
      password.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Memproses…';

    PL.login(username, pass).then(function (res) {
      if (!res.ok) {
        btn.disabled = false;
        btn.textContent = 'Login';
        showError(res.message);
        password.value = '';
        password.focus();
        return;
      }
      PLUI.toast(res.message, 'success');
      btn.textContent = 'Berhasil!';
      setTimeout(function () {
        location.replace('/admin/#dashboard');
      }, 550);
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Login';
      showError('Terjadi kesalahan. Coba lagi.');
    });
  });
})();
