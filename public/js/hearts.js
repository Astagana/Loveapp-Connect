// Menghasilkan hati-hati yang mengambang di latar belakang secara terus-menerus
(function () {
  const container = document.getElementById('heartsBg');
  if (!container) return;

  const emojis = ['💗', '💕', '💖', '💘', '💓', '🌹'];

  function spawnHeart() {
    const el = document.createElement('span');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const left = Math.random() * 100;
    const duration = 8 + Math.random() * 10;
    const size = 1 + Math.random() * 1.6;
    const drift = (Math.random() - 0.5) * 120;

    el.style.left = left + 'vw';
    el.style.fontSize = size + 'rem';
    el.style.animationDuration = duration + 's';
    el.style.setProperty('--drift', drift + 'px');

    container.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000 + 500);
  }

  for (let i = 0; i < 6; i++) {
    setTimeout(spawnHeart, i * 900);
  }
  setInterval(spawnHeart, 1400);
})();
