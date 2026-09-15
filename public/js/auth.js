function renderAuthPage() {
  document.getElementById('navbar').hidden = true;
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-auth');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  const tabBtns = app.querySelectorAll('.tab-btn');
  const loginForm = app.querySelector('#loginForm');
  const registerForm = app.querySelector('#registerForm');

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
      } else {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
      }
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = loginForm.querySelector('[data-error]');
    errEl.textContent = '';
    const fd = new FormData(loginForm);
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: fd.get('email'), password: fd.get('password') }
      });
      AppState.user = data.user;
      showToast(`Selamat datang kembali, ${data.user.name}! 💕`);
      location.hash = '#/dashboard';
      await bootAfterLogin();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = registerForm.querySelector('[data-error]');
    errEl.textContent = '';
    const fd = new FormData(registerForm);
    try {
      const data = await api('/auth/register', {
        method: 'POST',
        body: { name: fd.get('name'), email: fd.get('email'), password: fd.get('password') }
      });
      AppState.user = data.user;
      showToast(`Akun dibuat! Selamat datang, ${data.user.name} 🎉`);
      location.hash = '#/dashboard';
      await bootAfterLogin();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

async function bootAfterLogin() {
  document.getElementById('navbar').hidden = false;
  await refreshMe();
  handleRoute();
}

async function refreshMe() {
  const data = await api('/auth/me');
  AppState.user = data.user;
  AppState.partner = data.partner;
  return data;
}

function initLogout() {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    AppState.user = null;
    AppState.partner = null;
    document.getElementById('navbar').hidden = true;
    location.hash = '#/auth';
    renderAuthPage();
  });
}
