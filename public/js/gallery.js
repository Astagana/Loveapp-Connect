let pendingFile = null;

async function renderGalleryPage() {
  const app = document.getElementById('app');
  const tpl = document.getElementById('tpl-gallery');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  const cameraInput = document.getElementById('cameraInput');
  const galleryInput = document.getElementById('galleryInput');
  const preview = document.getElementById('uploadPreview');
  const previewImg = document.getElementById('previewImg');
  const captionInput = document.getElementById('captionInput');

  function onFileChosen(e) {
    const file = e.target.files[0];
    if (!file) return;
    pendingFile = file;
    previewImg.src = URL.createObjectURL(file);
    preview.classList.remove('hidden');
  }

  cameraInput.addEventListener('change', onFileChosen);
  galleryInput.addEventListener('change', onFileChosen);

  document.getElementById('cancelUploadBtn').addEventListener('click', () => {
    pendingFile = null;
    preview.classList.add('hidden');
    captionInput.value = '';
    cameraInput.value = '';
    galleryInput.value = '';
  });

  document.getElementById('confirmUploadBtn').addEventListener('click', async () => {
    if (!pendingFile) return;
    const btn = document.getElementById('confirmUploadBtn');
    btn.disabled = true;
    btn.textContent = 'Mengirim...';
    try {
      const fd = new FormData();
      fd.append('photo', pendingFile);
      fd.append('caption', captionInput.value);
      await api('/photos', { method: 'POST', isForm: true, body: fd });
      showToast('Foto berhasil dikirim! 💕');
      preview.classList.add('hidden');
      captionInput.value = '';
      pendingFile = null;
      cameraInput.value = '';
      galleryInput.value = '';
      await loadGallery();
    } catch (err) {
      showToast(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Kirim 💕';
    }
  });

  await loadGallery();
}

async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  try {
    const data = await api('/photos');
    if (data.photos.length === 0) {
      grid.innerHTML = '<p class="muted">Belum ada foto. Jadilah yang pertama mengunggah! 📸</p>';
      return;
    }
    grid.innerHTML = data.photos.map((p) => `
      <div class="gallery-item">
        ${p.user_id === AppState.user.id ? `<button class="gallery-delete" data-id="${p.id}" title="Hapus">✕</button>` : ''}
        <img src="/uploads/${encodeURIComponent(p.filename)}" alt="${escapeHtml(p.caption) || 'Foto kenangan'}" loading="lazy">
        ${p.caption ? `<div class="gallery-caption">${escapeHtml(p.caption)}</div>` : ''}
        <div class="gallery-meta">${p.uploader_avatar || ''} ${escapeHtml(p.uploader_name)} · ${timeAgo(p.created_at)}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.gallery-delete').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Hapus foto ini?')) return;
        try {
          await api(`/photos/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Foto dihapus.');
          await loadGallery();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  } catch (err) {
    grid.innerHTML = '<p class="muted">Gagal memuat galeri.</p>';
  }
}
