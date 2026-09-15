async function renderNotesPage() {
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-notes');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById('noteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('noteInput');
    const content = input.value.trim();
    if (!content) return;
    try {
      await api('/messages', { method: 'POST', body: { type: 'note', content } });
      input.value = '';
      showToast('Catatan terkirim 💌');
      await loadAllNotes();
    } catch (err) {
      showToast(err.message);
    }
  });

  document.querySelectorAll('[data-quick]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await sendQuickMessage(btn.dataset.quick);
      await loadAllNotes();
    });
  });

  await loadAllNotes();
}

async function loadAllNotes() {
  const list = document.getElementById('allNotesList');
  if (!list) return;
  try {
    const data = await api('/messages');
    if (data.messages.length === 0) {
      list.innerHTML = '<p class="muted">Belum ada catatan cinta. Tulis yang pertama! 💌</p>';
      return;
    }
    list.innerHTML = data.messages.map(noteItemHtml).join('');
  } catch (err) {
    list.innerHTML = '<p class="muted">Gagal memuat catatan.</p>';
  }
}
