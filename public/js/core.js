// ============ State global sederhana ============
const AppState = {
  user: null,
  partner: null
};

// ============ Helper pemanggilan API ============
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    method: options.method || 'GET',
    headers: options.isForm ? {} : { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: options.body
      ? (options.isForm ? options.body : JSON.stringify(options.body))
      : undefined
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* respons kosong */ }

  if (!res.ok) {
    throw new Error(data.error || 'Terjadi kesalahan. Coba lagi.');
  }
  return data;
}

// ============ Toast notifikasi ============
let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr + 'Z').getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}
