async function renderDashboardPage() {
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-dashboard');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  await refreshMe();
  const { user, partner } = AppState;

  document.getElementById('myAvatar').textContent = user.avatar_emoji || '💖';
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');

  if (partner) {
    document.getElementById('partnerAvatar').textContent = partner.avatar_emoji || '🤍';
    heroTitle.textContent = `${user.name} 💕 ${partner.name}`;
    heroSubtitle.textContent = partner.mood ? `${partner.name} sedang merasa: ${partner.mood}` : 'Kalian berdua sedang terhubung';

    if (user.anniversary_date) {
      const days = Math.floor((Date.now() - new Date(user.anniversary_date).getTime()) / 86400000);
      if (days >= 0) {
        document.getElementById('counterBox').classList.remove('hidden');
        document.getElementById('dayCounter').textContent = days;
      }
    }

    document.getElementById('quickActions').classList.remove('hidden');
    document.getElementById('recentNotes').classList.remove('hidden');
    document.getElementById('noPartnerCard').classList.add('hidden');

    document.querySelectorAll('[data-quick]').forEach((btn) => {
      btn.addEventListener('click', () => sendQuickMessage(btn.dataset.quick));
    });

    await loadRecentNotes();
  } else {
    heroTitle.textContent = `Halo, ${user.name}! 👋`;
    heroSubtitle.textContent = 'Kamu belum terhubung dengan pasangan.';
    document.getElementById('noPartnerCard').classList.remove('hidden');
    setupPairingUI();
  }
}

function setupPairingUI() {
  const generateBtn = document.getElementById('generateCodeBtn');
  const codeDisplay = document.getElementById('codeDisplay');
  const acceptForm = document.getElementById('acceptCodeForm');
  const errEl = acceptForm.parentElement.querySelector('[data-error]');

  generateBtn.addEventListener('click', async () => {
    try {
      const data = await api('/pair/invite', { method: 'POST' });
      codeDisplay.textContent = data.code;
      codeDisplay.classList.remove('hidden');
      showToast('Kode dibuat! Bagikan ke pasanganmu 💌');
    } catch (err) {
      showToast(err.message);
    }
  });

  acceptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const code = document.getElementById('acceptCodeInput').value.trim();
    if (!code) return;
    try {
      const data = await api('/pair/accept', { method: 'POST', body: { code } });
      showToast(`Yeay! Kamu terhubung dengan ${data.partnerName} 🎉💞`);
      await renderDashboardPage();
    } catch (err) {
      errEl.textContent = err.message;
    }
  });
}

async function sendQuickMessage(type) {
  try {
    await api('/messages', { method: 'POST', body: { type } });
    showToast('Pesan terkirim! 💌');
    if (location.hash === '#/dashboard') await loadRecentNotes();
    if (location.hash === '#/notes' && typeof loadAllNotes === 'function') await loadAllNotes();
  } catch (err) {
    showToast(err.message);
  }
}

async function loadRecentNotes() {
  try {
    const data = await api('/messages');
    const list = document.getElementById('recentNotesList');
    if (!list) return;
    const recent = data.messages.slice(0, 5);
    if (recent.length === 0) {
      list.innerHTML = '<p class="muted">Belum ada pesan. Kirim yang pertama! 💌</p>';
      return;
    }
    list.innerHTML = recent.map(noteItemHtml).join('');
  } catch (err) {
    // diam saja, tidak kritikal untuk dashboard
  }
}

function noteItemHtml(m) {
  return `
    <div class="note-item">
      <span class="note-avatar">${m.sender_avatar || '💗'}</span>
      <div class="note-content">
        <div class="note-text">${escapeHtml(m.content)}</div>
        <div class="note-meta">${escapeHtml(m.sender_name)} · ${timeAgo(m.created_at)}</div>
      </div>
    </div>`;
}
