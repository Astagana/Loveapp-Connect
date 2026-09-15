const AVATAR_OPTIONS = ['💖', '💗', '💘', '💝', '🌹', '🐻', '🐱', '🦊', '🌸', '⭐', '🍓', '🧸'];

async function renderProfilePage() {
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-profile');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  await refreshMe();
  const { user, partner } = AppState;

  const picker = document.getElementById('avatarPicker');
  picker.innerHTML = AVATAR_OPTIONS.map((em) =>
    `<span class="avatar-option ${em === user.avatar_emoji ? 'selected' : ''}" data-emoji="${em}">${em}</span>`
  ).join('');

  let selectedEmoji = user.avatar_emoji;
  picker.querySelectorAll('.avatar-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      picker.querySelectorAll('.avatar-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedEmoji = opt.dataset.emoji;
    });
  });

  document.getElementById('moodInput').value = user.mood || '';
  document.getElementById('anniversaryInput').value = user.anniversary_date || '';

  document.getElementById('saveProfileBtn').addEventListener('click', async () => {
    try {
      await api('/auth/me', {
        method: 'PUT',
        body: {
          avatar_emoji: selectedEmoji,
          mood: document.getElementById('moodInput').value,
          anniversary_date: document.getElementById('anniversaryInput').value
        }
      });
      showToast('Profil disimpan 💾💕');
      await refreshMe();
    } catch (err) {
      showToast(err.message);
    }
  });

  const partnerBody = document.getElementById('partnerInfoBody');
  const unpairCard = document.getElementById('unpairCard');
  if (partner) {
    partnerBody.innerHTML = `
      <div class="note-item">
        <span class="note-avatar">${partner.avatar_emoji}</span>
        <div class="note-content">
          <div class="note-text"><strong>${escapeHtml(partner.name)}</strong></div>
          <div class="note-meta">${partner.mood ? 'Mood: ' + escapeHtml(partner.mood) : 'Belum ada status mood'}</div>
        </div>
      </div>`;
    unpairCard.hidden = false;
    document.getElementById('unpairBtn').addEventListener('click', async () => {
      if (!confirm('Yakin ingin memutuskan hubungan dengan pasanganmu di aplikasi ini?')) return;
      try {
        await api('/pair/unpair', { method: 'POST' });
        showToast('Hubungan diputuskan.');
        await refreshMe();
        location.hash = '#/dashboard';
        handleRoute();
      } catch (err) {
        showToast(err.message);
      }
    });
  } else {
    partnerBody.innerHTML = '<p class="muted">Kamu belum terhubung dengan pasangan. Buat koneksi dari halaman Beranda.</p>';
  }
}
