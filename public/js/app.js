const ROUTES = {
  '#/auth': { render: renderAuthPage, protected: false },
  '#/dashboard': { render: renderDashboardPage, protected: true },
  '#/map': { render: renderMapPage, protected: true },
  '#/gallery': { render: renderGalleryPage, protected: true },
  '#/notes': { render: renderNotesPage, protected: true },
  '#/profile': { render: renderProfilePage, protected: true }
};

function cleanupMapWatchers() {
  if (typeof stopGeoWatch === 'function') stopGeoWatch();
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    myMarker = null;
    partnerMarker = null;
  }
}

async function handleRoute() {
  let hash = location.hash || '#/dashboard';
  if (!ROUTES[hash]) hash = '#/dashboard';
  const route = ROUTES[hash];

  // Bersihkan peta jika berpindah dari halaman map
  if (hash !== '#/map') cleanupMapWatchers();

  if (route.protected && !AppState.user) {
    location.hash = '#/auth';
    renderAuthPage();
    return;
  }
  if (!route.protected && AppState.user) {
    location.hash = '#/dashboard';
    return;
  }

  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === hash);
  });

  try {
    await route.render();
  } catch (err) {
    showToast(err.message || 'Gagal memuat halaman.');
  }
}

window.addEventListener('hashchange', handleRoute);

async function init() {
  initLogout();
  try {
    await refreshMe();
    document.getElementById('navbar').hidden = false;
    if (!location.hash || location.hash === '#/auth') location.hash = '#/dashboard';
    await handleRoute();
  } catch (err) {
    document.getElementById('navbar').hidden = true;
    location.hash = '#/auth';
    renderAuthPage();
  }
}

init();
